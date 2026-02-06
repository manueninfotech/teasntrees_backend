import Delivery from "../../models/Delivery.js";
import Rider from "../../models/Rider.js";
import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import logger from "../../config/logger.js";
import { uploadToCloudinary } from "../../utils/imageUpload.js";
import { riderMetricsService } from "../../services/riderMetricsService.js";

/* ======================================================
   DELIVERY STATE MACHINE (STRICT)
====================================================== */
const VALID_TRANSITIONS = {
    assigned: ['heading_to_pickup'],
    heading_to_pickup: ['arrived_at_pickup'],
    arrived_at_pickup: ['picked_up'],
    picked_up: ['in_transit'],
    in_transit: ['arrived'],
    arrived: ['delivered']
};

/* ======================================================
   SOCKET HELPER
====================================================== */
const emitDeliveryStatus = (delivery, req) => {
    const io = req.app.get('io');
    if (!io) return;

    const payload = {
        deliveryId: delivery._id,
        orderId: delivery.orderId,
        status: delivery.status
    };

    io.to(SOCKET_ROOMS.order(delivery.orderId.toString()))
        .emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, payload);

    io.to(SOCKET_ROOMS.user(delivery.customerId.toString()))
        .emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, payload);

    io.to(SOCKET_ROOMS.role('admin'))
        .emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, payload);

    io.to(SOCKET_ROOMS.role('manager'))
        .emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, payload);
};

/* ======================================================
   GET ACTIVE DELIVERY
====================================================== */
export const getActiveDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            riderId: req.user.userId,
            status: { $nin: ['delivered', 'cancelled', 'rejected'] }
        })
            .populate('orderId')
            .populate('customerId', 'name mobile');

        res.json({ success: true, data: delivery || null });
    } catch (error) {
        logger.error('GetActiveDelivery Error:', error);
        res.status(500).json({ success: false });
    }
};

/* ======================================================
   ACCEPT DELIVERY
====================================================== */
export const acceptDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            _id: req.params.id,
            riderId: req.user.userId,
            status: 'assigned'
        });

        if (!delivery) {
            return res.status(400).json({
                success: false,
                message: 'Delivery cannot be accepted'
            });
        }

        delivery.status = 'heading_to_pickup';
        delivery.acceptedAt = new Date();
        await delivery.save();

        // Refresh Order ETA upon acceptance
        const Order = mongoose.model('Order');
        const order = await Order.findById(delivery.orderId);
        if (order) {
            const now = new Date();
            // If original ETA is missing or in the past, or if it's too close, refresh it
            if (!order.estimatedDeliveryTime || order.estimatedDeliveryTime < now) {
                const newEta = new Date();
                newEta.setMinutes(newEta.getMinutes() + 30);
                order.estimatedDeliveryTime = newEta;
                order.$locals.allowDeliverySync = true;
                await order.save();
            }
        }

        emitDeliveryStatus(delivery, req);

        res.json({
            success: true,
            message: 'Delivery accepted',
            data: delivery
        });

    } catch (error) {
        logger.error('AcceptDelivery Error:', error);
        res.status(500).json({ success: false });
    }
};

/* ======================================================
   REJECT DELIVERY (BEFORE PICKUP ONLY)
====================================================== */
export const rejectDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const delivery = await Delivery.findOne({
            _id: id,
            riderId: req.user.userId,
            status: 'assigned'
        }).populate('orderId');

        if (!delivery) {
            return res.status(400).json({
                success: false,
                message: 'Delivery cannot be rejected at this stage'
            });
        }

        delivery.status = 'rejected';
        delivery.rejectedAt = new Date();
        delivery.rejectionReason = reason || 'No reason provided';
        await delivery.save();

        // Release rider
        await Rider.findByIdAndUpdate(req.user.userId, {
            isOnDelivery: false
        });

        // Try reassignment
        const io = req.app.get('io');
        const assignmentResult =
            await riderAssignmentService.assignRiderWithRetry(
                delivery.orderId,
                io,
                {
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
                }
            );

        res.json({
            success: true,
            message: assignmentResult.success
                ? 'Delivery rejected and reassigned'
                : 'Delivery rejected, no riders available'
        });

    } catch (error) {
        logger.error('RejectDelivery Error:', error);
        res.status(500).json({ success: false });
    }
};

/* ======================================================
   UPDATE DELIVERY STATUS (STRICT FLOW)
====================================================== */
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { status, otp } = req.body;

        const delivery = await Delivery.findOne({
            _id: req.params.id,
            riderId: req.user.userId
        });

        if (!delivery) {
            return res.status(404).json({ success: false });
        }

        const allowedNext = VALID_TRANSITIONS[delivery.status] || [];
        if (!allowedNext.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid transition from ${delivery.status} to ${status}`
            });
        }

        // OTP verification
        if (status === 'picked_up' && delivery.pickupOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid Pickup OTP' });
        }

        if (status === 'delivered' && delivery.deliveryOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid Delivery OTP' });
        }

        // Timestamps + payout (ONLY ONCE)
        if (status === 'picked_up') {
            delivery.pickedUpAt = new Date();
        }

        if (status === 'delivered' && !delivery.deliveredAt) {
            delivery.deliveredAt = new Date();

            await Rider.findByIdAndUpdate(req.user.userId, {
                isOnDelivery: false,
                $inc: {
                    totalDeliveries: 1,
                    totalEarnings: delivery.totalEarning
                }
            });

            riderMetricsService.updateMetrics(req.user.userId);
        }

        delivery.status = status;
        await delivery.save();

        emitDeliveryStatus(delivery, req);

        if (status === 'delivered') {
            // Trigger reassignment for any waiting orders since this rider is now free
            riderAssignmentService.processWaitingOrders(req.app.get('io'));
        }

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            data: delivery
        });

    } catch (error) {
        logger.error('UpdateDeliveryStatus Error:', error);
        res.status(500).json({ success: false });
    }
};

/* ======================================================
   REAL-TIME LOCATION UPDATE
====================================================== */
export const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        await Rider.findByIdAndUpdate(req.user.userId, {
            currentLocation: {
                type: 'Point',
                coordinates: [lng, lat]
            }
        });

        const activeDelivery = await Delivery.findOne({
            riderId: req.user.userId,
            status: { $in: ['picked_up', 'in_transit', 'arrived'] }
        });

        if (activeDelivery) {
            req.app.get('io')
                ?.to(SOCKET_ROOMS.user(activeDelivery.customerId.toString()))
                .emit(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, {
                    lat,
                    lng
                });
        }

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false });
    }
};

/* ======================================================
   GET EARNINGS HISTORY
====================================================== */
export const getEarningsHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {
            riderId: req.user.userId,
            status: 'delivered'
        };

        const history = await Delivery.find(query)
            .select('deliveryNumber deliveredAt totalEarning baseEarning tipAmount distance')
            .sort({ deliveredAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Delivery.countDocuments(query);

        res.json({
            success: true,
            data: history,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings history'
        });
    }
};

/* ======================================================
   UPLOAD DELIVERY PROOF (POST DELIVERY ONLY)
====================================================== */
export const uploadDeliveryProof = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            _id: req.params.id,
            riderId: req.user.userId,
            status: 'delivered'
        });

        if (!delivery || !req.file) {
            return res.status(400).json({ success: false });
        }

        const result = await uploadToCloudinary(
            req.file.buffer,
            'delivery_proofs'
        );

        delivery.deliveryProof = result.secure_url;
        await delivery.save();

        res.json({
            success: true,
            data: { deliveryProof: delivery.deliveryProof }
        });

    } catch (error) {
        logger.error('UploadDeliveryProof Error:', error);
        res.status(500).json({ success: false });
    }
};
