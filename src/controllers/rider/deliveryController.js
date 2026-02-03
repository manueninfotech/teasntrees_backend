import Delivery from "../../models/Delivery.js";
import Order from "../../models/Order.js";
import Rider from "../../models/Rider.js";
import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import logger from "../../config/logger.js";
import { uploadToCloudinary } from "../../utils/imageUpload.js";
import { riderMetricsService } from "../../services/riderMetricsService.js";

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
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }
        if (delivery.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Delivery cannot be accepted (status is not assigned)' });
        }

        // ATOMIC LOCKING: Prevent race conditions if rider tries to accept multiple deliveries
        const lockedRider = await riderAssignmentService.atomicLockRider(req.user.userId);

        if (!lockedRider) {
            logger.warn(`[AcceptDelivery] Rider ${req.user.userId} already locked by another delivery`);
            return res.status(409).json({
                success: false,
                message: 'You are already assigned to another delivery. Please complete it first.'
            });
        }

        // Update delivery status
        delivery.status = 'accepted';
        delivery.acceptedAt = new Date();
        await delivery.save();

        // Update order status
        await Order.findByIdAndUpdate(delivery.orderId, { status: 'driver_assigned' });

        logger.info(`[AcceptDelivery] Rider ${req.user.name} accepted delivery ${delivery._id}`);

        // Notify customer and admin
        const io = req.app.get('io');
        if (io) {
            // Notify customer
            io.to(SOCKET_ROOMS.user(delivery.customerId.toString())).emit(SOCKET_EVENTS.DELIVERY_ACCEPTED, {
                orderId: delivery.orderId,
                deliveryId: delivery._id,
                riderName: req.user.name,
                vehicleType: lockedRider.vehicleType
            });

            // Notify admin/managers
            io.to(SOCKET_ROOMS.role('admin')).to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.DELIVERY_ACCEPTED, {
                orderId: delivery.orderId,
                deliveryId: delivery._id,
                riderId: req.user.userId,
                riderName: req.user.name
            });
        }

        res.json({ success: true, message: 'Delivery accepted successfully', data: delivery });
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

        const delivery = await Delivery.findOne({ _id: id, riderId: req.user.userId }).populate('orderId');

        if (!delivery || delivery.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Invalid delivery or status' });
        }

        // Mark current delivery as rejected
        delivery.status = 'rejected';
        delivery.rejectedAt = new Date();
        delivery.rejectionReason = reason || 'No reason provided';
        await delivery.save();

        logger.info(`[RejectDelivery] Rider ${req.user.name} rejected delivery ${delivery._id}: ${reason}`);

        // Get the order
        const order = delivery.orderId;

        // Prepare delivery data for retry (reuse same data)
        const deliveryData = {
            orderId: delivery.orderId._id,
            customerId: delivery.customerId,
            pickupLocation: delivery.pickupLocation,
            deliveryLocation: delivery.deliveryLocation,
            distance: delivery.distance,
            baseEarning: delivery.baseEarning,
            distanceBonus: delivery.distanceBonus,
            surgeBonus: delivery.surgeBonus,
            totalEarning: delivery.totalEarning,
            pickupOtp: delivery.pickupOtp,
            deliveryOtp: delivery.deliveryOtp
        };

        // Use retry logic to find next rider (exclude current rider)
        const io = req.app.get('io');
        const assignmentResult = await riderAssignmentService.assignRiderWithRetry(
            order,
            io,
            deliveryData
        );

        // Update rider metrics
        riderMetricsService.updateMetrics(req.user.userId);

        if (assignmentResult.success) {
            // Update order with new rider
            order.riderId = assignmentResult.rider._id;
            await order.save();

            logger.info(`[RejectDelivery] Successfully reassigned to ${assignmentResult.rider.name}`);

            return res.json({
                success: true,
                message: 'Delivery rejected and reassigned to next rider',
                nextRider: assignmentResult.rider.name
            });
        } else {
            // No riders available - update order status
            order.status = 'waiting_for_rider';
            order.notes = (order.notes || '') + `\nRider ${req.user.name} rejected. ${assignmentResult.reason}`;
            await order.save();

            logger.warn(`[RejectDelivery] No riders available after rejection`);

            // Notify admin
            if (io) {
                io.to(SOCKET_ROOMS.role('admin')).to(SOCKET_ROOMS.role('manager')).emit('alert:no-riders-available', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    message: `Rider rejected and no backup riders available`
                });
            }

            return res.json({
                success: true,
                message: 'Delivery rejected. No other riders available currently.',
                orderStatus: 'waiting_for_rider'
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

            // Update Metrics asynchronously
            riderMetricsService.updateMetrics(req.user.userId);
        }
        delivery.status = status;
        await delivery.save();
        // Notify Customer and Admin DIRECTLY
        const io = req.app.get('io');
        if (io) {
            const customerIdStr = delivery.customerId._id ? delivery.customerId._id.toString() : delivery.customerId.toString();
            const orderIdStr = delivery.orderId._id ? delivery.orderId._id.toString() : delivery.orderId.toString();

            const eventData = {
                orderId: orderIdStr,
                deliveryId: delivery._id,
                status: status
            };

            // Notify specific user room
            io.to(SOCKET_ROOMS.user(customerIdStr)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, eventData);
            io.to(SOCKET_ROOMS.user(customerIdStr)).emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, eventData);

            // Notify specific order room
            io.to(SOCKET_ROOMS.order(orderIdStr)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, eventData);
            io.to(SOCKET_ROOMS.order(orderIdStr)).emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, eventData);

            // Notify managers/admin
            io.to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, eventData);
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, eventData);
            io.to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, eventData);
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, eventData);
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
            const io = req.app.get('io');
            if (io) {
                // Notify Customer
                io.to(SOCKET_ROOMS.user(activeDelivery.customerId.toString())).emit(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, {
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
};