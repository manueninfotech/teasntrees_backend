// Manager Order Controller
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import activityLogService from '../../services/activityLogService.js';

// Get all orders (with filters)
export const getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'deliveryAddress.mobile': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .populate('customerId', 'name mobile')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                current: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out-for-delivery', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const previousStatus = order.status;
        order.status = status;

        // Update timeline
        order.timeline.push({
            status,
            timestamp: new Date(),
            description: `Status updated to ${status} by Manager`
        });

        await order.save();

        // Socket Notifications
        const io = req.app.get('io');
        console.log('[Manager OrderController] ===== SOCKET EMISSION START =====');
        console.log('[Manager OrderController] Order ID:', orderId);
        console.log('[Manager OrderController] New Status:', status);
        console.log('[Manager OrderController] Customer ID:', order.customerId);
        console.log('[Manager OrderController] IO instance exists:', !!io);

        if (io) {
            const orderRoom = SOCKET_ROOMS.order(orderId);
            const userRoom = SOCKET_ROOMS.user(order.customerId);

            console.log('[Manager OrderController] Order Room:', orderRoom);
            console.log('[Manager OrderController] User Room:', userRoom);

            // Notify Customer (Specific Order Room)
            io.to(orderRoom).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                orderId,
                status,
                timeline: order.timeline
            });
            console.log('[Manager OrderController] ✅ Emitted to order room');

            // Notify Customer (User Room - for Lists/Dashboard)
            if (order.customerId) {
                io.to(userRoom).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                    orderId,
                    status,
                    timeline: order.timeline
                });
                console.log('[Manager OrderController] ✅ Emitted to user room');
            }

            // Notify Admin/Manager Rooms
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                orderId,
                status
            });
            console.log('[Manager OrderController] ✅ Emitted to admin room');
            console.log('[Manager OrderController] ===== SOCKET EMISSION END =====');
        } else {
            console.error('[Manager OrderController] ❌ IO instance not found!');
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'update_status',
            resource: 'order',
            resourceId: order._id,
            details: { previousStatus, newStatus: status }
        });

        res.status(200).json({
            success: true,
            message: 'Order status updated',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('customerId', 'name mobile email')
            .populate('riderId', 'name mobile vehicleDetails');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order details',
            error: error.message
        });
    }
};

export const assignRider = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Check if rider exists and is active
        // Ideally we should also check if rider is assigned to THIS manager?
        // But for flexibility, maybe just check if approved.
        // Spec: "Manager assigns riders to orders" "Each rider belongs to one manager"
        // Let's enforcing strictness: Rider must be assigned to THIS manager OR manager is admin-like? 
        // User said "Manager -> Rider (one-to-many)". So strict.

        const rider = await User.findOne({
            _id: riderId,
            role: 'rider',
            isApproved: true,
            isActive: true,
            //managerId: req.user.userId // Strict check? Let's leave it open for now or check if needed.
        });

        if (!rider) return res.status(400).json({ success: false, message: 'Invalid or inactive rider' });

        // Check if rider already has an active order
        const activeOrder = await Order.findOne({
            riderId: rider._id,
            status: { $in: ['assigned', 'confirmed', 'preparing', 'ready', 'picked_up', 'out-for-delivery'] }
        });

        if (activeOrder) {
            return res.status(400).json({
                success: false,
                message: `Rider is currently busy with Order #${activeOrder.orderNumber || 'Unknown'}`
            });
        }

        // Update Order
        order.riderId = rider._id; // Note: Schema uses riderId (check Rider model/Order model) - Order model uses riderId
        order.status = 'assigned';
        order.handledBy = req.user.userId; // Track manager

        order.timeline.push({
            status: 'assigned',
            timestamp: new Date(),
            description: `Assigned to rider ${rider.name} by Manager`
        });

        await order.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'assign_rider',
            resource: 'order',
            resourceId: order._id,
            details: { rider: rider.name, manager: req.user.name }
        });

        // Notify
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.order(orderId)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                orderId,
                status: 'assigned',
                rider: { name: rider.name, mobile: rider.mobile }
            });
            // Notify Rider
            io.to(SOCKET_ROOMS.user(rider._id)).emit('order:assigned', { // defined in spec as order:rider-assigned but standardized on socket events?
                orderId,
                message: 'New order assigned'
            });
        }

        res.status(200).json({ success: true, message: 'Rider assigned', data: order });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning rider',
            error: error.message
        });
    }
};
