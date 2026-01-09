import Order from "../../models/Order.js";
import User from "../../models/User.js";

// Get all orders with filters
export const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, customerId } = req.query;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (customerId) {
            query.customer = customerId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const orders = await Order.find(query)
            .populate('customer', 'name mobile email')
            .populate('items.product', 'name price image')
            .populate('assignedRider', 'name mobile')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
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
        const order = await Order.findById(req.params.Id)
            .populate('customer', 'name mobile email address')
            .populate('items.product', 'name price image')
            .populate('assignedRider', 'name mobile');
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
        order.assignedRider = riderId;
        order.status = 'out-for-delivery';
        order.dispatchedAt = new Date();

        await order.save();

        const updatedOrder = await Order.findById(order._id)
            .populate('assignedRider', 'name mobile');
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
