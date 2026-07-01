import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import User from '../../models/User.js';
import Delivery from '../../models/Delivery.js';
import Coupon from '../../models/Coupon.js';
import PDFDocument from 'pdfkit';
import logger from '../../config/logger.js';
import { notificationService } from '../../services/notificationService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import { statsService } from '../../services/statsService.js';
import { isCakeCategoryName } from '../../utils/cakeUtils.js';
import Settings from '../../models/Settings.js'
import Outlet from '../../models/Outlet.js'

/* =========================================================
   CREATE ORDER (CUSTOMER)
========================================================= */
export const createOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, deliveryInstructions, paymentMethod = 'COD', couponCode, location } = req.body;
        const customerId = req.user.userId;

        if (!items || !items.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        if (!deliveryAddress) {
            return res.status(400).json({ success: false, message: 'Delivery address required' });
        }

        // Handle deliveryAddress as either string or object with pincode
        const pincode = typeof deliveryAddress === 'object' ? deliveryAddress.pincode : null;
        
        // FOOLPROOF LOCATION PARSING
        let finalDeliveryAddress = {
            address: typeof deliveryAddress === 'string' ? deliveryAddress : deliveryAddress.address
        };

        if (location && location.coordinates && location.coordinates.length === 2) {
            finalDeliveryAddress.location = {
                type: 'Point',
                coordinates: location.coordinates, // [lng, lat]
            };
            if (location.address) {
                finalDeliveryAddress.address = `${location.address}: ${finalDeliveryAddress.address}`;
            }
        }

        // 1. Batch fetch products and categories
        const productIds = items.map(i => i.product);
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const categoryIds = [...new Set(products.map(p => p.category).filter(id => id))];
        const categories = await Category.find({ _id: { $in: categoryIds } }).select('name').lean();

        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        const categoryMap = new Map(categories.map(c => [c._id.toString(), c]));

        const brandsGrouped = {};
        const productUpdates = [];

        for (const item of items) {
            const product = productMap.get(item.product.toString());
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

            const category = product.category ? categoryMap.get(product.category.toString()) : null;
            const hasCakePricing =
                product.cakePricing &&
                product.cakePricing.basePricePerKg !== undefined &&
                product.cakePricing.basePricePerKg !== null;
            const isLittlehCake = brand === 'littleh' && isCakeCategoryName(category?.name || '');

            let price = item.price ?? product.price ?? 0;
            let weight = item.weight;
            let isCustomized = Boolean(item.isCustomized);
            let isEggless = Boolean(item.isEggless);
            let customizationDetails = item.customizationDetails || null;

            if (isLittlehCake) {
                const cakePricing = product.cakePricing || {};
                const customizationEnabled =
                    cakePricing.customizationAvailable === true ||
                    (cakePricing.customizationPricePerKg !== undefined && cakePricing.customizationPricePerKg !== null);
                weight = Number(weight || 1);
                if (!Number.isFinite(weight) || weight <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid cake weight for ${product.name}`
                    });
                }
                if (isCustomized && !customizationEnabled) {
                    return res.status(400).json({
                        success: false,
                        message: `Customization is not available for ${product.name}`
                    });
                }
                if (isEggless && hasCakePricing && cakePricing.egglessAvailable === false) {
                    return res.status(400).json({
                        success: false,
                        message: `Eggless option is not available for ${product.name}`
                    });
                }

                const perKg = isCustomized
                    ? (cakePricing.customizationPricePerKg ?? cakePricing.basePricePerKg ?? product.price ?? 0)
                    : (cakePricing.basePricePerKg ?? product.price ?? 0);

                price = perKg * weight;
                if (isEggless) {
                    price += (cakePricing.egglessExtraCharge ?? 100);
                }
            }

            brandsGrouped[brand].items.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price,
                finalPrice: price,
                weight,
                isCustomized,
                isEggless,
                customization: item.customization || '',
                customizationDetails
            });
            brandsGrouped[brand].subtotal += (price * (item.quantity || 0));

            productUpdates.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $inc: { orderCount: item.quantity } }
                }
            });
        }

        const Settings = await import('../../models/Settings.js').then(m => m.default);
        const settings = await Settings.findOne().lean();
        const deliveryChargePerOrder = settings ? settings.deliveryCharge : 50;
        const gstRate = settings ? (settings.gstRate || settings.taxPercentage || 5) : 5;

        const Outlet = await import('../../models/Outlet.js').then(m => m.default);
        const outlets = await Outlet.find({ isActive: true }).lean();
        
        // --- COUPON VALIDATION ---
        let globalDiscount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            console.log(`[Order] Validating coupon: ${couponCode} for order subtotal: ${Object.values(brandsGrouped).reduce((sum, g) => sum + g.subtotal, 0)}`);
            appliedCoupon = await Coupon.findOne({
                code: couponCode.trim().toUpperCase(),
                isActive: true
            });

            if (!appliedCoupon) {
                return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
            }

            const totalSubtotal = Object.values(brandsGrouped).reduce((sum, g) => sum + g.subtotal, 0);
            const now = new Date();

            // Expiry Check
            if (now > new Date(appliedCoupon.expiryDate)) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            // Min Order Value Check
            if (totalSubtotal < appliedCoupon.minOrderValue) {
                return res.status(400).json({ success: false, message: `Minimum order value of ₹${appliedCoupon.minOrderValue} required for this coupon` });
            }

            // Usage Limit Check (Global)
            if (appliedCoupon.usageLimit !== null && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
            }

            // Per User Limit Check
            if (appliedCoupon.perUserLimit !== null) {
                const userUsage = appliedCoupon.userUsage.find(u => u.userId.toString() === customerId.toString());
                if (userUsage && userUsage.count >= appliedCoupon.perUserLimit) {
                    return res.status(400).json({ success: false, message: 'You have already used this coupon' });
                }
            }

            // First Order Check
            if (appliedCoupon.firstOrderOnly) {
                const previousOrders = await Order.countDocuments({
                    customerId,
                    status: { $nin: ['cancelled'] }
                });
                if (previousOrders > 0) {
                    return res.status(400).json({ success: false, message: 'This coupon is only valid for your first order' });
                }
            }

            // Calculate Discount
            if (appliedCoupon.discountType === 'flat') {
                globalDiscount = Math.min(appliedCoupon.discountAmount, totalSubtotal);
            } else {
                globalDiscount = (totalSubtotal * appliedCoupon.discountAmount) / 100;
                if (appliedCoupon.maxDiscount) {
                    globalDiscount = Math.min(globalDiscount, appliedCoupon.maxDiscount);
                }
            }
            
            globalDiscount = Math.round(globalDiscount * 100) / 100;
            console.log(`[Order] Global discount calculated: ₹${globalDiscount}`);

            // Increment usage count
            appliedCoupon.usedCount += 1;
            const userUsageIndex = appliedCoupon.userUsage.findIndex(u => u.userId.toString() === customerId.toString());
            if (userUsageIndex > -1) {
                appliedCoupon.userUsage[userUsageIndex].count += 1;
            } else {
                appliedCoupon.userUsage.push({ userId: customerId, count: 1 });
            }
            await appliedCoupon.save();
        }

        const createdOrders = [];
        let grandTotalAllOrders = 0;

        for (const [brand, group] of Object.entries(brandsGrouped)) {
            const outlet = outlets.find(o => o.brand === brand);
            const tax = Math.round(group.subtotal * (gstRate / 100) * 100) / 100;
            
            // Apply discount to the first order that can accommodate it
            let orderDiscount = 0;
            if (globalDiscount > 0) {
                // If coupon is brand-specific, only apply if brand matches
                if (!appliedCoupon.brand || appliedCoupon.brand === brand) {
                    orderDiscount = Math.min(globalDiscount, group.subtotal);
                    globalDiscount -= orderDiscount;
                }
            }

            const orderTotal = Math.round((group.subtotal + deliveryChargePerOrder + tax - orderDiscount) * 100) / 100;
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
                couponCode: orderDiscount > 0 ? appliedCoupon.code : null,
                discount: orderDiscount,
                total: orderTotal,
                deliveryAddress: finalDeliveryAddress,
                paymentMethod,
                specialInstructions: deliveryInstructions,
                status: 'pending'
            });

            createdOrders.push(order);
        }

        // 2. Batch product stats and Dashboard increments
        if (productUpdates.length) {
            Product.bulkWrite(productUpdates).catch(() => { });
        }

        if (createdOrders.length) {
            await statsService.bulkIncrement({
                totalOrders: createdOrders.length,
                pendingOrders: createdOrders.length
            });
        }

        // Socket and Notifications
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

        try {
            const admins = await User.find({ role: { $in: ['admin', 'manager'] } }).select('_id').lean();
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
        const { page = 1, limit = 10, status, ignoreBrand, excludeStatus } = req.query;

        const query = { customerId };
        if (req.activeBrand && String(ignoreBrand) !== 'true') query.brand = req.activeBrand;
        if (status) query.status = status;
        if (excludeStatus) query.status = { $ne: excludeStatus };

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('items.product', 'name image')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

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

        logger.info(`GET ORDER BY ID - orderId: ${orderId}, customerId: ${customerId}, brand: ${req.activeBrand}`);

        const query = { _id: orderId, customerId };

        const order = await Order.findOne(query)
            .populate('items.product', 'name image price')
            .populate('riderId', 'name mobile')
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const delivery = await Delivery.findOne({ orderId: order._id })
            .populate('riderId', 'name mobile')
            .lean();

        const data = { ...order };

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
            .populate('items.product')
            .lean();

        if (!original) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        req.body.items = original.items.map(i => ({
            product: i.product?._id || i.product,
            quantity: i.quantity,
            price: i.price,
            weight: i.weight,
            isCustomized: i.isCustomized,
            isEggless: i.isEggless,
            customization: i.customization,
            customizationDetails: i.customizationDetails
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
            .populate('customerId', 'name mobile email')
            .lean();

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
