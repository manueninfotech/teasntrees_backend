import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import Delivery from '../../models/Delivery.js';
import PDFDocument from 'pdfkit';
import logger from '../../config/logger.js';
import { notificationService } from '../../services/notificationService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import { statsService } from '../../services/statsService.js';

/* =========================================================
   CREATE ORDER (CUSTOMER)
========================================================= */
export const createOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, deliveryInstructions, paymentMethod = 'COD' } = req.body;
        const customerId = req.user.userId;

        if (!items || !items.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        if (!deliveryAddress) {
            return res.status(400).json({ success: false, message: 'Delivery address required' });
        }

        const brandsGrouped = {};
        let grandTotalAllOrders = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product || !product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Product unavailable`
                });
            }

            const brand = product.brand || 'teasntrees';
            if (!brandsGrouped[brand]) {
                brandsGrouped[brand] = { items: [], subtotal: 0 };
            }

            const price = item.price ?? product.price;
            brandsGrouped[brand].items.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price,
                customization: item.customization || ''
            });
            brandsGrouped[brand].subtotal += price * item.quantity;
        }

        const settings = await import('../../models/Settings.js').then(m => m.default.findOne());
        const deliveryChargePerOrder = settings ? settings.deliveryCharge : 50;
        const gstRate = settings ? settings.gstRate : 5;

        const Outlet = await import('../../models/Outlet.js').then(m => m.default);
        const outlets = await Outlet.find({ isActive: true });

        const createdOrders = [];

        for (const [brand, group] of Object.entries(brandsGrouped)) {
            const outlet = outlets.find(o => o.brand === brand);
            const tax = group.subtotal * (gstRate / 100);
            const orderTotal = group.subtotal + deliveryChargePerOrder + tax;
            grandTotalAllOrders += orderTotal;

            const order = await Order.create({
                customerId,
                brand,
                outletId: outlet ? outlet._id : undefined,
                pickupLocation: outlet ? outlet.location : undefined,
                items: group.items,
                subtotal: group.subtotal,
                deliveryCharge: deliveryChargePerOrder,
                tax,
                total: orderTotal,
                deliveryAddress,
                paymentMethod,
                specialInstructions: deliveryInstructions,
                status: 'pending'
            });

            createdOrders.push(order);

            // Update product stats asynchronously
            Promise.all(group.items.map(i =>
                Product.findByIdAndUpdate(i.product, { $inc: { orderCount: i.quantity } })
            )).catch(() => { });
        }

        // Stats
        for (let i = 0; i < createdOrders.length; i++) {
            await statsService.increment('totalOrders');
            await statsService.increment('pendingOrders');
        }

        const io = req.app.get('io');
        if (io) {
            createdOrders.forEach(order => {
                io.to(SOCKET_ROOMS.user(customerId.toString()))
                    .emit(SOCKET_EVENTS.ORDER_CREATED, {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        total: order.total
                    });

                io.emit(SOCKET_EVENTS.ORDER_NEW, {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    total: order.total,
                    status: order.status
                });
            });
        }

        // Notify admins
        try {
            const admins = await User.find({ role: { $in: ['admin', 'manager'] } });
            createdOrders.forEach(order => {
                notificationService.sendPushToMany(admins, {
                    title: '🛒 New Order',
                    body: `Order #${order.orderNumber} for ₹${order.total}`,
                    data: { orderId: order._id }
                }).catch(() => { });
            });
        } catch { }

        res.status(201).json({
            success: true,
            data: {
                orderId: createdOrders[0]._id, // legacy
                orderNumber: createdOrders[0].orderNumber,
                orderIds: createdOrders.map(o => o._id),
                orders: createdOrders,
                total: grandTotalAllOrders,
                status: 'pending'
            }
        });

    } catch (error) {
        logger.error('createOrder failed', error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};

/* =========================================================
   GET MY ORDERS
========================================================= */
export const getMyOrders = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;

        const query = { customerId };
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('items.product', 'name image')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: Number(page),
                    totalPages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
};

/* =========================================================
   GET ORDER DETAILS
========================================================= */
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        const order = await Order.findOne({ _id: orderId, customerId })
            .populate('items.product', 'name image price')
            .populate('riderId', 'name mobile');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const delivery = await Delivery.findOne({ orderId: order._id })
            .populate('riderId', 'name mobile');

        const data = order.toObject();

        if (delivery) {
            const allowOtp = ['in_transit', 'arrived'].includes(delivery.status);

            data.delivery = {
                status: delivery.status,
                deliveryNumber: delivery.deliveryNumber,
                estimatedTime: delivery.estimatedTime,
                deliveryOtp: allowOtp ? delivery.deliveryOtp : null,
                rider: delivery.riderId
            };
        }

        res.json({ success: true, data });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
};

/* =========================================================
   CANCEL ORDER (CUSTOMER)
========================================================= */
export const cancelOrder = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { orderId } = req.params;
        const { reason } = req.body || {};

        const order = await Order.findOne({ _id: orderId, customerId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Order can no longer be cancelled'
            });
        }

        order.status = 'cancelled';
        order.cancelReason = reason || 'Cancelled by customer';
        await order.save();

        // Cancel delivery ONLY if exists & not picked up
        const delivery = await Delivery.findOne({ orderId: order._id });
        if (delivery && !['picked_up', 'in_transit', 'delivered'].includes(delivery.status)) {
            delivery.status = 'cancelled';
            delivery.cancelledAt = new Date();
            await delivery.save();
        }

        const io = req.app.get('io');
        if (io) {
            io.emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, {
                orderId: order._id,
                status: 'cancelled'
            });
        }

        res.json({
            success: true,
            message: 'Order cancelled',
            data: { orderNumber: order.orderNumber }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Cancel failed' });
    }
};

/* =========================================================
   REORDER
========================================================= */
export const reorder = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { orderId } = req.params;

        const original = await Order.findOne({ _id: orderId, customerId })
            .populate('items.product');

        if (!original) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        req.body.items = original.items.map(i => ({
            product: i.product._id,
            quantity: i.quantity,
            customization: i.customization
        }));

        req.body.deliveryAddress = original.deliveryAddress;
        return createOrder(req, res);

    } catch (error) {
        res.status(500).json({ success: false, message: 'Reorder failed' });
    }
};

/* =========================================================
   DOWNLOAD INVOICE
========================================================= */
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
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.text(`Order: ${order.orderNumber}`);
        doc.text(`Date: ${order.createdAt.toDateString()}`);
        doc.moveDown();

        order.items.forEach(item => {
            doc.text(`${item.name} x${item.quantity} - ₹${item.price * item.quantity}`);
        });

        doc.moveDown();
        doc.text(`Total: ₹${order.total}`, { align: 'right' });
        doc.end();

    } catch (error) {
        res.status(500).json({ success: false, message: 'Invoice generation failed' });
    }
};
