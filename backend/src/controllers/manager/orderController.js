import Order from '../../models/Order.js';
import Delivery from '../../models/Delivery.js';
import User from '../../models/User.js';
import { riderAssignmentService } from '../../services/riderAssignmentService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import activityLogService from '../../services/activityLogService.js';

/* =========================================================
   GET ORDERS (MANAGER)
========================================================= */
export const getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;
        const query = {};

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
   UPDATE ORDER STATUS (MANAGER – BUSINESS ONLY)
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
        order.status = status;

        order.timeline.push({
            status,
            timestamp: new Date(),
            description: `Updated by manager`
        });

        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.order(orderId)).emit(
                SOCKET_EVENTS.ORDER_STATUS_UPDATED,
                { orderId, status }
            );

            io.to(SOCKET_ROOMS.role('admin'))
                .to(SOCKET_ROOMS.role('manager'))
                .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId,
                    status
                });
        }

        await activityLogService.log(req, {
            action: 'update_status',
            resource: 'order',
            resourceId: order._id,
            details: { previousStatus, newStatus: status }
        });

        res.json({ success: true, data: order });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Status update failed' });
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
   ASSIGN RIDER (MANAGER – SAFE)
========================================================= */
export const assignRider = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const rider = await User.findOne({
            _id: riderId,
            role: 'rider',
            isActive: true,
            isApproved: true,
            isOnline: true
        });

        if (!rider) {
            return res.status(400).json({
                success: false,
                message: 'Rider is not available'
            });
        }

        // Check active delivery instead of Order
        const activeDelivery = await Delivery.findOne({
            riderId: rider._id,
            status: { $nin: ['delivered', 'cancelled', 'rejected'] }
        });

        if (activeDelivery) {
            return res.status(400).json({
                success: false,
                message: 'Rider already has an active delivery'
            });
        }

        // Move order to system-owned state
        order.riderId = rider._id;
        order.status = 'waiting_for_rider';
        order.handledBy = req.user.userId;

        order.timeline.push({
            status: 'waiting_for_rider',
            timestamp: new Date(),
            description: `Rider ${rider.name} assigned by manager`
        });

        await order.save();

        // Delegate delivery creation to service
        try {
            await riderAssignmentService.createOrUpdateDelivery(order, rider);

            const io = req.app.get('io');
            if (io) {
                // Notify rider
                io.to(SOCKET_ROOMS.user(rider._id.toString()))
                    .emit(SOCKET_EVENTS.DELIVERY_ASSIGNED, {
                        orderId,
                        orderNumber: order.orderNumber
                    });

                // Notify all managers/admins
                io.to(SOCKET_ROOMS.role('admin'))
                    .to(SOCKET_ROOMS.role('manager'))
                    .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                        orderId: order._id,
                        status: order.status
                    });
            }

            await activityLogService.log(req, {
                action: 'assign_rider',
                resource: 'order',
                resourceId: order._id,
                details: { rider: rider.name, manager: req.user.name }
            });

            res.json({
                success: true,
                message: 'Rider assigned successfully',
                data: order
            });

        } catch (serviceError) {
            logger.error(`Manager assignment failed: ${serviceError.message}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to complete rider assignment',
                error: serviceError.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to assign rider'
        });
    }
};
