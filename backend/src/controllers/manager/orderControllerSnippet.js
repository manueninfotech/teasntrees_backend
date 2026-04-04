import Order from '../../models/Order.js';
import Rider from '../../models/Rider.js';
import Delivery from '../../models/Delivery.js';
import { riderAssignmentService } from '../../services/riderAssignmentService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import activityLogService from '../../services/activityLogService.js';

/* =========================================================
   ASSIGN RIDER (MANAGER – SAFE & CORRECT)
========================================================= */
export const assignRider = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body;

        // 1️⃣ Fetch order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // 2️⃣ Fetch rider (strict checks)
        const rider = await Rider.findOne({
            _id: riderId,
            isApproved: true,
            isActive: true,
            isOnline: true
        });

        if (!rider) {
            return res.status(400).json({
                success: false,
                message: 'Rider is not available or inactive'
            });
        }

        // 3️⃣ Ensure rider has no active delivery
        const activeDelivery = await Delivery.findOne({
            riderId: rider._id,
            status: { $nin: ['delivered', 'cancelled', 'rejected'] }
        });

        if (activeDelivery) {
            return res.status(400).json({
                success: false,
                message: 'Rider is already on another delivery'
            });
        }

        // 4️⃣ Update order (SYSTEM state)
        order.riderId = rider._id;
        order.status = 'waiting_for_rider'; // ✅ CORRECT
        order.handledBy = req.user.userId;

        order.timeline.push({
            status: 'waiting_for_rider',
            timestamp: new Date(),
            description: `Rider ${rider.name} assigned by Manager ${req.user.name}`
        });

        await order.save();

        // 5️⃣ Create / update delivery via service (single source of truth)
        await riderAssignmentService.createOrUpdateDelivery(order, rider);

        // 6️⃣ Notify rider & dashboards
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(rider._id.toString()))
                .emit(SOCKET_EVENTS.DELIVERY_ASSIGNED, {
                    orderId: order._id,
                    orderNumber: order.orderNumber
                });

            io.to(SOCKET_ROOMS.role('admin'))
                .to(SOCKET_ROOMS.role('manager'))
                .emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId: order._id,
                    status: order.status
                });
        }

        // 7️⃣ Log activity
        await activityLogService.log(req, {
            action: 'assign_rider',
            resource: 'order',
            resourceId: order._id,
            details: {
                rider: rider.name,
                manager: req.user.name
            }
        });

        res.status(200).json({
            success: true,
            message: 'Rider assigned successfully',
            data: order
        });

    } catch (error) {
        console.error('assignRider error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign rider'
        });
    }
};

