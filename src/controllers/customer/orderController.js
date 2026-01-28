// Customer Order Controller
// Customers can place and view their own orders

import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import Delivery from '../../models/Delivery.js';
import PDFDocument from 'pdfkit';
import logger from '../../config/logger.js';
import { notificationService } from '../../services/notificationService.js';

// Create new order
// Create new order
export const createOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, deliveryZone, deliveryInstructions, paymentMethod = 'COD' } = req.body;
        const customerId = req.user.userId;
        logger.info('createOrder called with:', { customerId, itemsCount: items ? items.length : 0 });

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
            logger.info('Fetching product:', { productId: item.product });
            const product = await Product.findById(item.product);
            logger.info('Product found:', { name: product ? product.name : 'null' });

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
                address: typeof deliveryAddress === 'object' ? deliveryAddress.address : deliveryAddress,
                location: req.body.location || (typeof deliveryAddress === 'object' ? deliveryAddress.location : null)
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

        // Update product statistics (increment orderCount)
        // We do this asynchronously so it doesn't block the response
        Promise.all(orderItems.map(item =>
            Product.findByIdAndUpdate(item.product, {
                $inc: { orderCount: item.quantity }
            })
        )).catch(err => {
            logger.error('Failed to update product stats', { error: err.message });
        });

        // Emit socket event for real-time update
        const socketService = req.app.get('socketService');
        logger.info('SocketService status:', {
            found: !!socketService,
            type: typeof socketService,
            isFunction: socketService ? typeof socketService.notifyUser === 'function' : false
        });

        if (socketService && typeof socketService.notifyUser === 'function') {
            try {
                socketService.notifyUser(customerId.toString(), 'order:created', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    total: order.total
                });
            } catch (socketError) {
                logger.error('Socket notification failed', { error: socketError.message });
            }
        } else {
            logger.warn('SocketService missing or invalid, skipping notification');
        }

        // --- NEW: Push Notification to Admin ---
        try {
            const admins = await User.find({ role: { $in: ['admin', 'manager'] } });
            await notificationService.sendPushToMany(admins, {
                title: 'New Order Received! 🛍️',
                body: `Order #${order.orderNumber} for ₹${order.total} has been placed.`,
                data: { type: 'new_order', orderId: order._id }
            });
        } catch (adminPushErr) {
            logger.error('Admin push notification failed', { error: adminPushErr.message });
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

        // Search by Order ID or Product Name
        const { search, startDate, endDate } = req.query;

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'items.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Date Filter
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            query.createdAt = { $gte: new Date(startDate) };
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

        // Fetch delivery info if exists
        const delivery = await Delivery.findOne({ orderId: order._id })
            .populate('riderId', 'name mobile');

        const orderData = order.toObject();
        if (delivery) {
            orderData.delivery = {
                status: delivery.status,
                deliveryNumber: delivery.deliveryNumber,
                estimatedTime: delivery.estimatedTime,
                deliveryOtp: (order.status !== 'delivered' && order.status !== 'cancelled') ? delivery.deliveryOtp : null,
                rider: delivery.riderId
            };
        }

        res.json({
            success: true,
            data: orderData
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
        const { reason } = req.body || {};
        const customerId = req.user.userId;

        console.log(`CANCEL ORDER ATTEMPT: Order ID: ${orderId}, Customer ID: ${customerId}`);

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
        try {
            const socketService = req.app.get('socketService');
            if (socketService && typeof socketService.notifyUser === 'function') {
                socketService.notifyUser(customerId.toString(), 'order:cancelled', {
                    orderId: order._id,
                    orderNumber: order.orderNumber
                });
            }
        } catch (socketError) {
            console.error('Socket notification error in cancelOrder:', socketError);
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
            message: 'Failed to cancel order',
            error: error.message
        });
    }
};
// Reorder from past order
export const reorder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        // Fetch original order
        const originalOrder = await Order.findOne({
            _id: orderId,
            customerId
        }).populate('items.product');

        if (!originalOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate items and recalculate prices
        const newItems = [];
        let subtotal = 0;
        const unavailableItems = [];

        for (const item of originalOrder.items) {
            // Safe access in case product was deleted
            const productId = item.product?._id || item.product;
            if (!productId) {
                unavailableItems.push(item.name || 'Unknown Item');
                continue;
            }

            const product = await Product.findById(productId);

            if (!product || !product.isAvailable) {
                unavailableItems.push(item.name || product?.name || 'Unavailable Item');
                continue;
            }

            // Determine the correct price (current price for selected size or base price)
            let currentItemPrice = product.price;
            if (item.customization && product.sizeOptions && product.sizeOptions.length > 0) {
                const sizeOption = product.sizeOptions.find(opt => opt.size === item.customization);
                if (sizeOption) {
                    currentItemPrice = sizeOption.price;
                }
            }

            // Fallback for price if still missing (uses logic from Cart)
            if (currentItemPrice === undefined || currentItemPrice === null) {
                if (product.sizeOptions && product.sizeOptions.length > 0) {
                    currentItemPrice = Math.min(...product.sizeOptions.map(opt => opt.price));
                } else {
                    currentItemPrice = product.price || 0;
                }
            }

            const itemTotal = currentItemPrice * item.quantity;
            subtotal += itemTotal;

            newItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: currentItemPrice,
                customization: item.customization || ''
            });
        }

        if (newItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'None of the items from this order are currently available'
            });
        }

        // Calculate charges
        const deliveryCharge = 50; // Use current delivery logic (e.g. from Settings in real app)
        const tax = subtotal * 0.05;
        const total = subtotal + deliveryCharge + tax;

        // Create new order
        const newOrder = await Order.create({
            customerId,
            items: newItems,
            subtotal,
            deliveryCharge,
            tax,
            total,
            deliveryAddress: originalOrder.deliveryAddress, // Reuse full address object including location
            paymentMethod: originalOrder.paymentMethod, // Default to same method
            status: 'pending'
        });

        // Notify if some items were skipped
        const message = unavailableItems.length > 0
            ? `Order created, but some items were unavailable: ${unavailableItems.join(', ')}`
            : 'Order placed successfully';

        return res.status(201).json({
            success: true,
            message,
            data: {
                orderNumber: newOrder.orderNumber,
                orderId: newOrder._id,
                total: newOrder.total,
                status: newOrder.status,
                unavailableItems
            }
        });

    } catch (error) {
        logger.error('Error reordering', { error: error.message });
        console.error('Error in reorder:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reorder',
            error: error.message
        });
    }
};

// Download Invoice PDF
export const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        const order = await Order.findOne({ _id: orderId, customerId })
            .populate('items.product')
            .populate('customerId', 'name mobile email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
        doc.text(`Date: ${order.createdAt.toDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();

        // Customer Details
        doc.text(`Bill To:`);
        doc.text(order.customerId.name || 'Customer');
        doc.text(order.customerId.mobile);
        doc.moveDown();

        // Items Table Header
        const tableTop = 250;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Price', 350, tableTop);
        doc.text('Total', 450, tableTop);
        doc.font('Helvetica');

        // Items
        let y = tableTop + 25;
        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            doc.text(item.name ? item.name.substring(0, 30) : 'Item', 50, y);
            doc.text(item.quantity.toString(), 300, y);
            doc.text(item.price.toFixed(2), 350, y);
            doc.text(itemTotal.toFixed(2), 450, y);
            y += 25;
        });

        // Totals
        y += 20;
        doc.moveDown();
        const subtotal = order.subtotal || 0;
        const deliveryCharge = order.deliveryCharge || 0;
        const tax = order.tax || 0;
        const total = order.total || 0;

        doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 350, y);
        y += 20;
        doc.text(`Delivery: ${deliveryCharge.toFixed(2)}`, 350, y);
        y += 20;
        doc.text(`Tax: ${tax.toFixed(2)}`, 350, y);
        y += 25;
        doc.font('Helvetica-Bold').fontSize(14).text(`Total: ${total.toFixed(2)}`, 350, y);

        // Footer
        doc.fontSize(10).text('Thank you for shopping with us!', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        logger.error('Error generating invoice', { error: error.message });
        return res.status(500).json({ success: false, message: 'Failed to generate invoice' });
    }
};
