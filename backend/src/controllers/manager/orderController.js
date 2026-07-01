import Order from '../../models/Order.js';
import Delivery from '../../models/Delivery.js';
import User from '../../models/User.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import activityLogService from '../../services/activityLogService.js';
import { riderAssignmentService } from '../../services/riderAssignmentService.js';

/* =========================================================
   GET ORDERS (MANAGER)
========================================================= */
export const getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 1000, search } = req.query;
        const brand = req.activeBrand || req.params.brand || 'littleh';
        const query = { brand };

        if (status && status !== 'all') query.status = status;

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customerId.name': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('customerId', 'name mobile')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: Number(page),
                totalPages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
};

/* =========================================================
   UPDATE ORDER STATUS (MANAGER - BUSINESS ONLY)
========================================================= */
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(403).json({
                success: false,
                message: `Manager cannot set status '${status}'`
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const previousStatus = order.status;
        let finalStatus = status;

        if (status === 'ready') {
            finalStatus = 'waiting_for_rider';
        }

        order.status = finalStatus;

        order.timeline.push({
            status: order.status,
            timestamp: new Date(),
            description: 'Updated by manager'
        });

        await order.save();

        if (status === 'confirmed') {
            order.status = 'preparing';
            await order.save();
        }

        if (order.status === 'waiting_for_rider') {
            const io = req.app.get('io');
            riderAssignmentService.processWaitingOrders(io);
        }

        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.order(orderId)).emit(
                SOCKET_EVENTS.ORDER_STATUS_UPDATED,
                { orderId, status: order.status }
            );

            io.to(SOCKET_ROOMS.role('admin'))
                .to(SOCKET_ROOMS.role('manager'))
                .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId,
                    status: order.status
                });
        }

        await activityLogService.log(req, {
            action: 'update_status',
            resource: 'order',
            resourceId: order._id,
            details: { previousStatus, newStatus: order.status }
        });

        const updatedOrder = await Order.findById(order._id);

        res.json({ success: true, data: updatedOrder });

    } catch (error) {
        console.error('[Manager updateOrderStatus ERROR]', error);
        res.status(500).json({
            success: false,
            message: 'Status update failed',
            error: error.message
        });
    }
};

/* =========================================================
   GET ORDER DETAILS (MANAGER)
========================================================= */
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('customerId', 'name mobile email')
            .populate('riderId', 'name mobile');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
};

/* =========================================================
   INTERNAL RIDER ASSIGNMENT
========================================================= */
export const assignRider = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const rider = await User.findOne({ _id: riderId, role: 'rider' });
        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        const delivery = await riderAssignmentService.createOrUpdateDelivery(order, rider);

        order.status = 'assigned';
        order.riderId = rider._id;
        await order.save();

        res.json({
            success: true,
            message: 'Rider assigned successfully',
            data: { order, delivery }
        });

        // Socket events
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(order.customerId.toString()))
                .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId: order._id,
                    status: 'assigned'
                });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'assign_rider',
            resource: 'order',
            resourceId: order._id,
            details: { riderId: rider._id }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
