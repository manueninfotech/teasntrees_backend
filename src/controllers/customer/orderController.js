// Customer Order Controller
// Customers can place and view their own orders

import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import logger from '../../config/logger.js';

// Create new order
export const createOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, deliveryZone, deliveryInstructions, paymentMethod = 'COD' } = req.body;
        const customerId = req.user.userId;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please add items to your order'
            });
        }

        // Validate delivery address
        if (!deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`
                });
            }

            if (!product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Product not available: ${product.name}`
                });
            }

            const itemPrice = item.price || product.price;
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: itemPrice,
                customization: item.customization || ''
            });
        }

        // Calculate charges (you can customize these)
        const deliveryCharge = 50; // Fixed delivery charge
        const tax = subtotal * 0.05; // 5% tax
        const total = subtotal + deliveryCharge + tax;

        // Create order
        const order = await Order.create({
            customerId,
            items: orderItems,
            subtotal,
            deliveryCharge,
            tax,
            total,
            deliveryAddress: {
                address: deliveryAddress
            },
            paymentMethod,
            specialInstructions: deliveryInstructions,
            status: 'pending'
        });

        logger.info('Order created successfully', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId,
            total
        });

        // Emit socket event for real-time update
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.emitToUser(customerId.toString(), 'order:created', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                total: order.total
            });
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                orderNumber: order.orderNumber,
                orderId: order._id,
                total: order.total,
                status: order.status
            }
        });

    } catch (error) {
        logger.error('Error creating order', { error: error.message });
        console.error('Error in createOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
};

// Get customer's own orders
export const getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const customerId = req.user.userId;

        const query = { customerId };

        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('items.product', 'name image')
            .populate('riderId', 'name mobile')
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalOrders = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error in getMyOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

// Get single order details
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        const order = await Order.findOne({
            _id: orderId,
            customerId // Ensure customer can only view their own orders
        })
            .populate('items.product', 'name description image price')
            .populate('riderId', 'name mobile')
            .populate('customerId', 'name mobile email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Error in getOrderById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order details'
        });
    }
};

// Cancel order (only if status is pending)
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const customerId = req.user.userId;

        const order = await Order.findOne({
            _id: orderId,
            customerId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only allow cancellation if order is pending or accepted
        if (!['pending', 'accepted'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        order.cancelReason = reason || 'Cancelled by customer';
        await order.save();

        logger.info('Order cancelled by customer', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId
        });

        // Emit socket event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.emitToUser(customerId.toString(), 'order:cancelled', {
                orderId: order._id,
                orderNumber: order.orderNumber
            });
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                orderNumber: order.orderNumber,
                status: order.status
            }
        });

    } catch (error) {
        logger.error('Error cancelling order', { error: error.message });
        console.error('Error in cancelOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
};
