import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";

// Get all orders with filters
export const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, customerId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.order === 'desc' ? -1 : 1;
        const skip = (page - 1) * limit;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (customerId) {
            query.customerId = customerId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!isNaN(start)) query.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!isNaN(end)) query.createdAt.$lte = end;
            }
        }

        const orders = await Order.find(query)
            .populate('customerId', 'name mobile email')
            .populate('items.product', 'name price image')
            .populate('riderId', 'name mobile')
            .sort({ [sortBy]: sortOrder })
            .limit(limit)
            .skip(skip);
        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        console.error('GetAllOrders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name mobile email address')
            .populate('items.product', 'name price image')
            .populate('riderId', 'name mobile');
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
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        const order = await Order.findById(req.params.id);
        if (!Order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        order.status = status;
        // Update timestamps based on status
        if (status === 'confirmed') {
            order.confirmedAt = new Date();
        } else if (status === 'out-for-delivery') {
            order.outForDeliveryAt = new Date();
        } else if (status === 'delivered') {
            order.deliveredAt = new Date();
        }
        await order.save();

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            // Notify customer
            socketService.notifyUser(order.customerId.toString(), 'order:status-updated', {
                orderId: order._id,
                status: order.status,
                estimatedDelivery: order.estimatedDeliveryTime
            });

            // Notify managers/admin
            socketService.notifyRole('manager', 'order:status-updated', {
                orderId: order._id,
                status: order.status,
                customerId: order.customerId
            });
            socketService.notifyRole('admin', 'order:status-updated', {
                orderId: order._id,
                status: order.status,
                customerId: order.customerId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
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

// Assign delivery rider to order
export const assignDeliveryRider = async (req, res) => {
    try {
        const { riderId } = req.body;
        if (!riderId) {
            return res.status(400).json({
                success: false,
                message: 'Rider ID is required'
            });
        }
        // verify rider exists and has rider role
        const rider = await User.findById(riderId);
        if (!rider || rider.role !== 'rider') {
            return res.status(404).json({
                success: false,
                message: 'Rider not found or invalid rider'
            });
        }
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        order.riderId = riderId;
        order.status = 'out-for-delivery';
        order.dispatchedAt = new Date();

        await order.save();

        const updatedOrder = await Order.findById(order._id)
            .populate('riderId', 'name mobile');

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            // Notify the assigned rider
            socketService.notifyUser(riderId, 'delivery:assigned', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                deliveryAddress: order.deliveryAddress
            });

            // Notify customer
            socketService.notifyUser(order.customerId.toString(), 'order:rider-assigned', {
                orderId: order._id,
                riderName: rider.name,
                riderMobile: rider.mobile
            });

            // Notify managers/admin
            socketService.notifyRole('manager', 'delivery:assigned', {
                orderId: order._id,
                riderId: riderId,
                riderName: rider.name
            });
        }

        res.status(200).json({
            success: true,
            message: 'Rider assigned successfully',
            data: updatedOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning rider to order',
            error: error.message
        });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel delivered order'
            });
        }

        order.status = 'cancelled';
        order.cancelReason = reason || 'Cancelled by admin';
        order.cancelledAt = new Date();

        await order.save();

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            // Notify customer
            socketService.notifyUser(order.customerId.toString(), 'order:cancelled', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                reason: order.cancelReason
            });

            // Notify rider if assigned
            if (order.riderId) {
                socketService.notifyUser(order.riderId.toString(), 'order:cancelled', {
                    orderId: order._id,
                    orderNumber: order.orderNumber
                });
            }

            // Notify managers/admin
            socketService.notifyRole('manager', 'order:cancelled', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                customerId: order.customerId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};
// Get order statistics

export const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        // Calculate total revenue
        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                confirmedOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                todayOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order stats',
            error: error.message
        });
    }
};
