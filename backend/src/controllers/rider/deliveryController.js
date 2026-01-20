import Delivery from "../../models/Delivery.js";
import Order from "../../models/Order.js";
import Rider from "../../models/Rider.js";
import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import logger from "../../config/logger.js";
import { uploadToCloudinary } from "../../utils/imageUpload.js";

// Get current active delivery
export const getActiveDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            riderId: req.user.userId,
            status: { $in: ['assigned', 'accepted', 'heading_to_pickup', 'arrived_at_pickup', 'picked_up', 'in_transit', 'arrived'] }
        })
            .populate('orderId')
            .populate('customerId', 'name mobile location address');
        if (!delivery) {
            return res.json({
                success: true, data: null
            });
        }
        res.json({ success: true, data: delivery });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch active delivery' });
    }
};

// Accept delivery assignment
export const acceptDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const delivery = await Delivery.findOne({ _id: id, riderId: req.user.userId });
        if (!delivery) {
            res.status(404).json({ success: false, message: 'Delivery not found' });
        }
        if (delivery.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Delivery cannot be accepted (status is not assigned)' });
        }
        delivery.status = 'accepted';
        delivery.acceptedAt = new Date();
        await delivery.save();
        // update order status
        await Order.findByIdAndUpdate(delivery.orderId, { status: 'driver_assigned' });
        // update rider status
        await Rider.findByIdAndUpdate(req.user.userId, { isOnDelivery: true });

        // Notify customer
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyUser(delivery.customerId, 'order:rider-assigned', {
                orderId: delivery.orderId,
                riderName: req.user.name
            });
        }
        res.json({ success: true, message: 'delivery accepted', data: delivery });
    } catch (error) {
        logger.error('Accept delivery error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept delivery', error: error.message });
    }
};

// Reject Delivery & Re-assign
export const rejectDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const delivery = await Delivery.findOne({ _id: id, riderId: req.user.userId });

        if (!delivery || delivery.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Invalid delivery or status' });
        }

        // 1. Mark current delivery as rejected
        delivery.status = 'rejected';
        delivery.rejectedAt = new Date();
        delivery.rejectionReason = reason;
        await delivery.save();

        // 2. Find Next Best Rider
        // We need customer location from the original delivery (it's in deliveryLocation.coordinates [lng, lat])
        const customerLocation = {
            lng: delivery.deliveryLocation.coordinates[0],
            lat: delivery.deliveryLocation.coordinates[1]
        };
        const nextRider = await riderAssignmentService.findBestRider(customerLocation);

        if (nextRider) {
            // 3. Create NEW Delivery for Next Rider
            const newDelivery = new Delivery({
                orderId: delivery.orderId,
                riderId: nextRider._id,
                customerId: delivery.customerId,
                pickupLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,
                distance: delivery.distance,
                baseEarning: delivery.baseEarning,
                totalEarning: delivery.totalEarning,
                status: 'assigned',
                assignedAt: new Date()
            });

            await newDelivery.save();

            // Notify New Rider
            const socketService = req.app.get('socketService');
            if (socketService) {
                // Notify New Rider (Assigned)
                socketService.notifyUser(nextRider._id, 'delivery:assigned', {
                    deliveryId: newDelivery._id,
                    orderId: newDelivery.orderId,
                    earning: newDelivery.totalEarning
                });
            }

            return res.json({
                success: true,
                message: 'Delivery rejected and re-assigned to next rider',
                nextRider: nextRider.name
            });

        } else {
            // No Riders Available!
            // Notify Admin so they can manually handle it
            const socketService = req.app.get('socketService');
            if (socketService) {
                socketService.broadcastToRole('admin', 'alert:no-riders-available', {
                    orderId: delivery.orderId,
                    message: 'Order rejected and no backup riders found!'
                });
            }

            return res.json({
                success: true,
                message: 'Delivery rejected. No other riders available currently.'
            });
        }

    } catch (error) {
        logger.error('Reject Delivery Error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject delivery' });
    }
};
// Update Delivery Status 
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, otp } = req.body;
        // statuses: heading_to_pickup, arrived_at_pickup, picked_up, in_transit, arrived, delivered
        const delivery = await Delivery.findOne({ _id: id, riderId: req.user.userId });
        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }
        // OTP Verification Logic
        if (status === 'picked_up') {
            if (delivery.pickupOtp && delivery.pickupOtp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid Pickup OTP' });
            }
            delivery.pickedUpAt = new Date();
            // Update Order
            await Order.findByIdAndUpdate(delivery.orderId, { status: 'out_for_delivery' });
        }
        if (status === 'delivered') {
            if (delivery.deliveryOtp && delivery.deliveryOtp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid Delivery OTP' });
            }
            delivery.deliveredAt = new Date();
            delivery.isPaid = true; // Assuming auto-payout calculation logic runs here or later

            // Release Rider
            await Rider.findByIdAndUpdate(req.user.userId, {
                isOnDelivery: false,
                $inc: { totalDeliveries: 1, totalEarnings: delivery.totalEarning }
            });

            // Update Order
            await Order.findByIdAndUpdate(delivery.orderId, { status: 'delivered' });
        }
        delivery.status = status;
        await delivery.save();
        // Notify Customer and Admin
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyUser(delivery.customerId, 'order:status-updated', {
                orderId: delivery.orderId,
                status: status
            });
        }
        res.json({ success: true, message: `Status updated to ${status}`, data: delivery });
    } catch (error) {
        logger.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};
// Update Real-Time Location
export const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const riderId = req.user.userId;
        // Update Rider Doc
        await Rider.findByIdAndUpdate(riderId, {
            currentLocation: {
                type: 'Point',
                coordinates: [lng, lat], // GeoJSON order: [lng, lat]
                lastUpdated: new Date()
            }
        });
        // Find Active Delivery to notify customer
        const activeDelivery = await Delivery.findOne({
            riderId,
            status: { $in: ['accepted', 'heading_to_pickup', 'picked_up', 'in_transit'] }
        });
        if (activeDelivery) {
            const socketService = req.app.get('socketService');
            if (socketService) {
                // Notify Customer
                socketService.notifyUser(activeDelivery.customerId.toString(), 'rider:location-update', {
                    orderId: activeDelivery.orderId,
                    riderId,
                    location: { lat, lng }
                });
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};
// Get Earnings History
export const getEarningsHistory = async (req, res) => {
    try {
        const history = await Delivery.find({
            riderId: req.user.userId,
            status: 'delivered'
        })
            .select('deliveryNumber deliveredAt totalEarning baseEarning tipAmount distance')
            .sort({ deliveredAt: -1 })
            .limit(50);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};

// Upload Delivery Proof
export const uploadDeliveryProof = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const delivery = await Delivery.findOne({ _id: id, riderId: req.user.userId });
        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'delivery_proofs');

        // Update Delivery
        delivery.deliveryProof = result.secure_url;
        await delivery.save();

        res.json({
            success: true,
            message: 'Proof uploaded successfully',
            data: { deliveryProof: delivery.deliveryProof }
        });

    } catch (error) {
        logger.error('Upload Proof Error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload proof' });
    }
}