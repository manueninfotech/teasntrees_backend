import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import Delivery from "../../models/Delivery.js";
import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import { surgeService } from "../../services/surgeService.js";
import { getDistance } from "../../utils/geoUtils.js";

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

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        if (!paymentStatus || !['pending', 'paid', 'refunded'].includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        ).populate('customerId', 'name mobile email')
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
            message: 'Payment status updated successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
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
        if (!order) {
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

        // --- AUTO-ASSIGNMENT LOGIC ---
        if (status === 'confirmed') {
            try {
                // Fixed Outlet Location
                const OUTLET_LOCATION = { lat: 12.9716, lng: 77.5946 };

                // Get Customer Location from Order
                const customerLoc = order.deliveryAddress?.location?.coordinates; // [lng, lat]
                if (customerLoc) {
                    const deliveryLocation = { lng: customerLoc[0], lat: customerLoc[1] };

                    // Find Best Rider
                    const bestRider = await riderAssignmentService.findBestRider(deliveryLocation);

                    if (bestRider) {
                        // Calculate Distance for Record
                        const distMeters = getDistance(
                            OUTLET_LOCATION.lat, OUTLET_LOCATION.lng,
                            deliveryLocation.lat, deliveryLocation.lng
                        );

                        // Calculate Surge
                        const { multiplier, reason } = await surgeService.getSurgeMultiplier();
                        const baseFee = 40;
                        const distBonus = Math.max(0, (distMeters / 1000 - 3) * 10);
                        const surgeAmount = Math.round((baseFee + distBonus) * (multiplier - 1));
                        const totalEarning = Math.round((baseFee + distBonus) * multiplier);

                        // Create Delivery Record
                        const delivery = new Delivery({
                            orderId: order._id,
                            riderId: bestRider._id,
                            customerId: order.customerId,
                            pickupLocation: {
                                type: 'Point',
                                coordinates: [OUTLET_LOCATION.lng, OUTLET_LOCATION.lat],
                                address: 'Teas N Trees Outlet'
                            },
                            deliveryLocation: order.deliveryAddress.location,
                            distance: distMeters,
                            baseEarning: baseFee,
                            distanceBonus: distBonus,
                            surgeBonus: surgeAmount,
                            rejectionReason: reason !== 'Normal' ? `Surge: ${reason}` : undefined,
                            totalEarning: totalEarning,
                            status: 'assigned',
                            assignedAt: new Date(),
                            pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                            deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
                        });

                        await delivery.save();

                        // Notify Assigned Rider
                        if (socketService) {
                            socketService.notifyUser(bestRider._id.toString(), 'delivery:assigned', {
                                deliveryId: delivery._id,
                                orderId: order._id,
                                earning: delivery.totalEarning,
                                pickupAddress: 'Teas N Trees Outlet',
                                deliveryAddress: order.deliveryAddress.address
                            });
                            console.log(`[Auto-Assign] Assigned Order ${order.orderNumber} to ${bestRider.name}`);
                        }
                    } else {
                        console.warn(`[Auto-Assign] No online riders found for Order ${order.orderNumber}`);
                        // Notify Admin of Failure
                        if (socketService) {
                            socketService.broadcastToRole('admin', 'alert:no-riders-available', {
                                orderId: order._id,
                                message: 'Order Confirmed but No Riders Available!'
                            });
                        }
                    }
                }
            } catch (assignError) {
                console.error('Auto-Assignment Failed:', assignError);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('UpdateOrderStatus Error:', error);
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

        // In-progress orders (confirmed, preparing, ready, assigned, picked_up, out-for-delivery, in_transit)
        const inProgressOrders = await Order.countDocuments({
            status: { $in: ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out-for-delivery', 'in_transit'] }
        });

        // Calculate total revenue from delivered orders
        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Today's orders and revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // Today's revenue from delivered orders
        const todayRevenueData = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    deliveredAt: { $gte: today }
                }
            },
            { $group: { _id: null, todayRevenue: { $sum: '$total' } } }
        ]);

        const todayRevenue = todayRevenueData.length > 0 ? todayRevenueData[0].todayRevenue : 0;

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                confirmedOrders,
                inProgressOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                todayRevenue,
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
