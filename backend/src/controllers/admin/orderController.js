import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Settings from "../../models/Settings.js";

import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import { getDistance } from "../../utils/geoUtils.js";

import { SOCKET_EVENTS, SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import activityLogService from "../../services/activityLogService.js";

/* =========================================================
   GET ALL ORDERS
========================================================= */
export const getAllOrders = async (req, res) => {
    try {
        const { status, customerId, startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (customerId) query.customerId = customerId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('customerId', 'name mobile email')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   GET SINGLE ORDER
========================================================= */
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name mobile email address')
            .populate('riderId', 'name mobile');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   UPDATE ORDER STATUS (ADMIN – BUSINESS ONLY)
========================================================= */
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelReason } = req.body;

        const allowedStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(403).json({
                success: false,
                message: `Admin cannot set status to '${status}'`
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const transitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['cancelled'],
            waiting_for_rider: ['cancelled'],
            assigned: ['cancelled'],
            'out-for-delivery': ['cancelled'],
            in_transit: ['cancelled']
        };

        if (!transitions[order.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid transition from '${order.status}' to '${status}'`
            });
        }

        // Business status update (admin only)
        order.status = status;

        if (status === 'confirmed') {
            order.confirmedAt = new Date();
        }

        if (status === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancelReason = cancelReason || 'Cancelled by admin';
        }

        await order.save();

        // Auto-assign only AFTER confirming.
        // Confirmed should advance to preparing automatically.
        if (status === 'confirmed') {
            order.status = 'preparing';
            await order.save();

            const coords = order.deliveryAddress?.location?.coordinates;
            if (coords && coords.length === 2) {
                const OUTLET = { lat: 16.3090716, lng: 80.4308257 };
                const distance = getDistance(
                    OUTLET.lat,
                    OUTLET.lng,
                    coords[1],
                    coords[0]
                );

                const settings = (await Settings.findOne()) || {};
                const base = settings.riderBaseEarning || 20;
                const rate = settings.distanceBonusPerKm || 5;

                const result = await riderAssignmentService.assignRiderWithRetry(
                    order,
                    req.app.get('io'),
                    {
                        orderId: order._id,
                        customerId: order.customerId,
                        pickupLocation: {
                            type: 'Point',
                            coordinates: [OUTLET.lng, OUTLET.lat],
                            address: 'Teas N Trees Outlet'
                        },
                        deliveryLocation: order.deliveryAddress.location,
                        distance,
                        baseEarning: base,
                        totalEarning: Math.round(base + (distance / 1000) * rate),
                        pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                        deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
                    }
                );

                if (!result.success) {
                    order.status = 'waiting_for_rider';
                    await order.save();
                }
            }
        }

        // If kitchen finished (ready) and still no rider, show waiting_for_rider
        if (status === 'ready' && !order.riderId) {
            order.status = 'waiting_for_rider';
            await order.save();
        }

        // Re-fetch to return latest state (Delivery hook may have updated it)
        const updatedOrder = await Order.findById(order._id);

        // Socket events
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(order.customerId.toString()))
                .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId: updatedOrder._id,
                    status: updatedOrder.status
                });

            io.to(SOCKET_ROOMS.role('admin'))
                .to(SOCKET_ROOMS.role('manager'))
                .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId: updatedOrder._id,
                    status: updatedOrder.status
                });
        }

        await activityLogService.log(req, {
            action: 'update_status',
            resource: 'order',
            resourceId: updatedOrder._id,
            details: { status: updatedOrder.status }
        });

        return res.json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });

    } catch (error) {
        console.error('[updateOrderStatus ERROR]', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =========================================================
   UPDATE PAYMENT STATUS (ADMIN – CONTROLLED)
========================================================= */
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const allowed = ['pending', 'paid', 'refunded'];

        if (!allowed.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(order.customerId.toString()))
                .emit('payment:status-updated', {
                    orderId: order._id,
                    paymentStatus
                });
        }

        res.json({
            success: true,
            message: 'Payment status updated',
            data: order
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/* =========================================================
   MANUAL RIDER ASSIGNMENT
========================================================= */
export const assignDeliveryRider = async (req, res) => {
    try {
        const { riderId } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const rider = await User.findById(riderId);
        if (!rider || rider.role !== 'rider') {
            return res.status(400).json({ success: false, message: 'Invalid rider' });
        }

        await riderAssignmentService.createOrUpdateDelivery(order, rider);

        res.json({
            success: true,
            message: 'Rider assigned successfully',
            data: order
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/* =========================================================
   CANCEL ORDER
========================================================= */
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel delivered order' });
        }

        order.status = 'cancelled';
        order.cancelReason = reason || 'Cancelled by admin';
        order.cancelledAt = new Date();
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   ORDER STATS
========================================================= */
export const getOrderStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            inProgressOrders,
            revenueData
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'delivered' }),
            Order.countDocuments({ status: 'cancelled' }),
            Order.countDocuments({
                status: {
                    $in: [
                        'confirmed',
                        'preparing',
                        'ready',
                        'waiting_for_rider',
                        'assigned',
                        'out-for-delivery',
                        'in_transit'
                    ]
                }
            }),
            Order.aggregate([
                {
                    $match: {
                        status: 'delivered',
                        deliveredAt: { $gte: today }
                    }
                },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                inProgressOrders,
                todayRevenue: revenueData.length > 0 ? revenueData[0].total : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
