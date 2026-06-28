import mongoose from "mongoose";
import Delivery from "../../models/Delivery.js";
import Rider from "../../models/Rider.js";
import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import logger from "../../config/logger.js";
import { uploadService } from '../../services/storage/upload.service.js';
import { riderMetricsService } from "../../services/riderMetricsService.js";
import activityLogService from "../../services/activityLogService.js";

/* ======================================================
   DELIVERY STATE MACHINE (STRICT)
====================================================== */
const VALID_TRANSITIONS = {
    accepted: ['heading_to_pickup'],
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
        deliveryId: delivery._id.toString(),
        orderId: delivery.orderId.toString(),
        status: delivery.status
    };

    io.to(SOCKET_ROOMS.order(delivery.orderId.toString()))
        .emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, payload);

    io.to(SOCKET_ROOMS.user(delivery.customerId.toString()))
        .emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATED, payload);

    // Also emit order:status-updated so user app generic listeners catch it
    io.to(SOCKET_ROOMS.user(delivery.customerId.toString()))
        .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
            orderId: delivery.orderId.toString(),
            status: delivery.status
        });

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
   GET DELIVERY BY ID
====================================================== */
export const getDeliveryById = async (req, res) => {
    try {
        const { id } = req.params;
        const delivery = await Delivery.findOne({
            _id: id,
            riderId: req.user.userId
        })
            .populate('orderId')
            .populate('customerId', 'name mobile');

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        res.json({ success: true, data: delivery });
    } catch (error) {
        logger.error('GetDeliveryById Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
            status: 'pending_acceptance'
        });

        if (!delivery) {
            return res.status(400).json({
                success: false,
                message: 'Delivery cannot be accepted'
            });
        }

        delivery.status = 'accepted';
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

        // Set rider as busy
        await Rider.findByIdAndUpdate(req.user.userId, {
            isOnDelivery: true
        });

        emitDeliveryStatus(delivery, req);

        // Log Activity
        await activityLogService.log(req, {
            action: 'accept_delivery',
            resource: 'delivery',
            resourceId: delivery._id,
        });

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
            status: 'pending_acceptance'
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

        // Log Activity
        await activityLogService.log(req, {
            action: 'reject_delivery',
            resource: 'delivery',
            resourceId: delivery._id,
            details: { reason: delivery.rejectionReason }
        });

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
                },
                [req.user.userId]
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
        const { status, otp, paymentMode, amountCollected } = req.body;

        const delivery = await Delivery.findOne({
            _id: req.params.id,
            riderId: req.user.userId
        }).populate('orderId');

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

        // COD Payment Handling
        if (status === 'delivered') {
            const isCOD = delivery.orderId.paymentMethod?.toUpperCase() === 'COD';
            if (isCOD) {
                if (!paymentMode || !['cash', 'upi'].includes(paymentMode)) {
                    return res.status(400).json({ success: false, message: 'Payment mode (cash/upi) required for COD' });
                }
                delivery.paymentMode = paymentMode;
                delivery.amountCollected = amountCollected || delivery.orderId.total;
                delivery.paymentStatus = 'collected';
            }
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

            await riderMetricsService.updateMetrics(req.user.userId);
        }

        const previousStatus = delivery.status;
        delivery.status = status;
        await delivery.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'update_status',
            resource: 'delivery',
            resourceId: delivery._id,
            details: { previousStatus, newStatus: status }
        });

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
========================================================= */
export const updateLocation = async (req, res) => {
    try {
        let { lat, lng, location } = req.body;

        // Support both {lat, lng} and {location: {lat, lng}} formats from Flutter
        if (location && location.lat !== undefined) {
            lat = location.lat;
            lng = location.lng;
        }

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: 'Coordinates are required' });
        }

        await Rider.findByIdAndUpdate(req.user.userId, {
            currentLocation: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            lastUpdated: new Date()
        });

        const activeDelivery = await Delivery.findOne({
            riderId: req.user.userId,
            status: { $in: ['accepted', 'heading_to_pickup', 'arrived_at_pickup', 'picked_up', 'in_transit', 'arrived'] }
        });
if (activeDelivery) {
    req.app.get('io')
        ?.to(SOCKET_ROOMS.user(activeDelivery.customerId.toString()))
        .emit(SOCKET_EVENTS.RIDER_LOCATION_UPDATE, {
            orderId: activeDelivery.orderId.toString(),
            riderId: req.user.userId.toString(),
            lat,
            lng
        });
}


        res.json({ success: true });

    } catch (error) {
        logger.error('[updateLocation Error]', error);
        res.status(500).json({ success: false, message: error.message });
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
            .populate('customerId', 'name mobile')
            .populate('orderId', 'deliveryAddress total paymentMethod items brand')
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

        const result = await uploadService.uploadPrivateFile(
            req.file.buffer,
            'delivery_proofs',
            req.file.mimetype
        );

        delivery.deliveryProof = result.url;
        await delivery.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'upload_proof',
            resource: 'delivery',
            resourceId: delivery._id
        });

        res.json({
            success: true,
            data: { deliveryProof: delivery.deliveryProof }
        });

    } catch (error) {
        logger.error('UploadDeliveryProof Error:', error);
        res.status(500).json({ success: false });
    }
};
