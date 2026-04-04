// Customer Cart Controller
// Manage shopping cart for customers

import mongoose from 'mongoose';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import Order from '../../models/Order.js';
import Settings from '../../models/Settings.js';
import Outlet from '../../models/Outlet.js';
import logger from '../../config/logger.js';
import { geocodingService } from '../../services/geocodingService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import { statsService } from '../../services/statsService.js';
import { isCakeCategoryName } from '../../utils/cakeUtils.js';

// Helper function for background geocoding
async function processGeocoding(orderId, address) {
    try {
        const coords = await geocodingService.getCoordinates(address);
        if (coords) {
            await Order.updateOne(
                { _id: orderId },
                {
                    $set: {
                        'deliveryAddress.location': {
                            type: 'Point',
                            coordinates: [coords.lng, coords.lat]
                        }
                    }
                }
            );
            logger.info(`Background geocoding completed for order ${orderId}`);
        }
    } catch (error) {
        logger.error(`Background geocoding failed for order ${orderId}`, { error: error.message });
    }
}

const getCategoryNameFromProduct = async (product) => {
    if (!product?.category) return '';
    if (typeof product.category === 'object' && product.category.name) return product.category.name;
    const category = await Category.findById(product.category).select('name').lean();
    return category?.name || '';
};

const normalizeCakeCustomization = (customization) => {
    const defaults = {
        weight: 1,
        isCustomized: false,
        isEggless: false,
        customizationDetails: {
            cakeMessage: '',
            colorTheme: '',
            designDescription: '',
            referenceImage: ''
        }
    };

    if (!customization || typeof customization !== 'object') return defaults;

    const weight = Number(customization.weight);
    const details = customization.customizationDetails || {};

    return {
        weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        isCustomized: Boolean(customization.isCustomized),
        isEggless: Boolean(customization.isEggless),
        customizationDetails: {
            cakeMessage: details.cakeMessage || '',
            colorTheme: details.colorTheme || '',
            designDescription: details.designDescription || '',
            referenceImage: details.referenceImage || ''
        }
    };
};

const buildCakeLabel = ({ weight, isCustomized, isEggless }) => {
    const parts = [`${weight}kg`, isCustomized ? 'Customized' : 'Standard'];
    if (isEggless) parts.push('Eggless');
    return parts.join(' | ');
};

// Get customer's cart
export const getCart = async (req, res) => {
    try {

        const userId = req.user.userId;

        const cart = await Cart.findOne({ userId }).lean();

        if (!cart) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    subtotal: 0,
                    itemCount: 0
                }
            });
        }

        res.json({
            success: true,
            data: {
                items: cart.items,
                subtotal: cart.subtotal,
                itemCount: cart.items.length
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch cart"
        });
    }
};
// Add item to cart
export const addToCart = async (req, res) => {
    try {

        const userId = req.user.userId;
        const { productId, quantity = 1, customization = '' } = req.body;

        // Get product
        const product = await Product.findById(productId).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!product.isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Product is not available"
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: []
            });
        }

        let itemPrice = product.price || 0;
        let itemCustomizationLabel = typeof customization === "string" ? customization : "";

        let itemWeight = null;
        let itemIsCustomized = false;
        let itemIsEggless = false;
        let itemCustomizationDetails = undefined;

        // Cake logic
        if (product.brand === "littleh" && product.cakePricing) {

            const cakePricing = product.cakePricing;
            const cakeConfig = normalizeCakeCustomization(customization);

            const perKg = cakeConfig.isCustomized
                ? (cakePricing.customizationPricePerKg ?? cakePricing.basePricePerKg ?? product.price ?? 0)
                : (cakePricing.basePricePerKg ?? product.price ?? 0);

            itemPrice = perKg * cakeConfig.weight;

            if (cakeConfig.isEggless) {
                itemPrice += (cakePricing.egglessExtraCharge ?? 100);
            }

            itemCustomizationLabel = buildCakeLabel(cakeConfig);

            itemWeight = cakeConfig.weight;
            itemIsCustomized = cakeConfig.isCustomized;
            itemIsEggless = cakeConfig.isEggless;
            itemCustomizationDetails = cakeConfig.customizationDetails;

        } else {

            // size option logic
            if (itemCustomizationLabel && product.sizeOptions?.length) {

                const sizeOption = product.sizeOptions.find(
                    opt => opt.size === itemCustomizationLabel
                );

                if (sizeOption) {
                    itemPrice = sizeOption.price;
                }
            }

            if (!itemPrice) {
                if (product.sizeOptions?.length) {
                    itemPrice = Math.min(...product.sizeOptions.map(opt => opt.price));
                } else {
                    itemPrice = product.price || 0;
                }
            }
        }

        // Check existing item
        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            item.customization === itemCustomizationLabel &&
            (item.weight || null) === (itemWeight || null) &&
            Boolean(item.isCustomized) === Boolean(itemIsCustomized) &&
            Boolean(item.isEggless) === Boolean(itemIsEggless)
        );

        if (existingItemIndex > -1) {

            cart.items[existingItemIndex].quantity += quantity;

        } else {

            cart.items.push({
                product: productId,
                name: product.name,
                image: product.image,
                quantity,
                price: itemPrice,
                finalPrice: itemPrice,
                customization: itemCustomizationLabel,
                weight: itemWeight,
                isCustomized: itemIsCustomized,
                isEggless: itemIsEggless,
                customizationDetails: itemCustomizationDetails,
                brand: product.brand || "teasntrees"
            });

        }

        // Save cart
        await cart.save();

        logger.info("Item added to cart", {
            userId,
            productId,
            quantity
        });

        // Return cart without populate
        res.status(201).json({
            success: true,
            message: "Item added to cart",
            data: {
                items: cart.items,
                subtotal: cart.subtotal,
                itemCount: cart.items.length
            }
        });

    } catch (error) {

        logger.error("Error adding to cart", { error: error.message });

        res.status(500).json({
            success: false,
            message: "Failed to add item to cart"
        });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        // ATOMIC UPDATE: More efficient than findOne + save
        const cart = await Cart.findOneAndUpdate(
            { userId, 'items._id': itemId },
            { $set: { 'items.$.quantity': quantity } },
            { new: true }
        ).populate({
            path: 'items.product',
            select: 'name description image price isAvailable',
            options: { lean: true }
        }).lean();

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart or item not found'
            });
        }

        res.json({
            success: true,
            message: 'Cart updated',
            data: {
                items: cart.items,
                subtotal: cart.subtotal,
                itemCount: cart.items.length
            }
        });

    } catch (error) {
        logger.error('Error updating cart item', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item'
        });
    }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { itemId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove item using pull (for subdocuments)
        cart.items.pull(itemId);
        await cart.save();
        await cart.populate('items.product', 'name description image price isAvailable');

        logger.info('Item removed from cart', {
            userId,
            itemId
        });

        res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                items: cart.items,
                subtotal: cart.subtotal,
                itemCount: cart.items.length
            }
        });

    } catch (error) {
        logger.error('Error removing cart item', { error: error.message });
        console.error('Error in removeCartItem:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart'
        });
    }
};

// Clear entire cart
export const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        // ATOMIC CLEAR: Just update the document without fetching it first
        await Cart.updateOne(
            { userId },
            { $set: { items: [], subtotal: 0 } }
        );

        logger.info('Cart cleared', { userId });

        res.json({
            success: true,
            message: 'Cart cleared',
            data: {
                items: [],
                subtotal: 0,
                itemCount: 0
            }
        });

    } catch (error) {
        logger.error('Error clearing cart', { error: error.message });
        console.error('Error in clearCart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart'
        });
    }
};

// Checkout - Convert cart to order
export const checkoutCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { deliveryAddress, deliveryInstructions, paymentMethod = 'COD' } = req.body;

        // Get cart
        const cart = await Cart.findOne({ userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate delivery address
        if (!deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        // Validate all items are still available and group by brand
        const unavailableItems = [];
        const brandsGrouped = {};

        for (const item of cart.items) {
            if (!item.product || !item.product.isAvailable) {
                unavailableItems.push(item.name || 'Unknown Item');
            } else {
                const brand = item.product.brand || 'teasntrees';
                if (!brandsGrouped[brand]) {
                    brandsGrouped[brand] = {
                        items: [],
                        subtotal: 0
                    };
                }
                brandsGrouped[brand].items.push({
                    product: item.product._id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    finalPrice: item.finalPrice || item.price,
                    weight: item.weight,
                    isCustomized: Boolean(item.isCustomized),
                    isEggless: Boolean(item.isEggless),
                    customization: item.customization,
                    customizationDetails: item.customizationDetails
                });
                brandsGrouped[brand].subtotal += (item.price * item.quantity);
            }
        }

        if (unavailableItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some items are no longer available',
                unavailableItems
            });
        }


        // --- NEW: Atomic Geocoding moved to background ---
        let finalizedAddress = {
            address: ''
        };

        if (typeof deliveryAddress === 'object') {
            finalizedAddress.address = deliveryAddress.address || deliveryAddress.addressLine || 'Unknown Address';
            if (deliveryAddress.location && Array.isArray(deliveryAddress.location.coordinates) && deliveryAddress.location.coordinates.length === 2 &&
                (deliveryAddress.location.coordinates[0] !== 0 || deliveryAddress.location.coordinates[1] !== 0)) {
                finalizedAddress.location = deliveryAddress.location;
            }
        } else {
            finalizedAddress.address = deliveryAddress || 'Unknown Address';
        }

        // We no longer await geocoding here to keep the checkout API fast.
        // It will be processed in the background if location is missing.

        const estimatedDeliveryTime = new Date();
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);

        // Fetch outlets for assigning pickup locations
        const outlets = await Outlet.find({ isActive: true });

        const createdOrders = [];
        let grandTotalAllOrders = 0;

        for (const [brand, group] of Object.entries(brandsGrouped)) {
            const settings = await Settings.findOne({ brand });
            const deliveryChargePerOrder = settings ? settings.deliveryCharge : 50;
            const gstRate = settings ? settings.gstRate : 5;

            const outlet = outlets.find(o => o.brand === brand);
            const tax = group.subtotal * (gstRate / 100);
            const orderTotal = group.subtotal + deliveryChargePerOrder + tax;
            grandTotalAllOrders += orderTotal;

            const orderPayload = {
                customerId: userId,
                brand: brand,
                outletId: outlet ? outlet._id : undefined,
                items: group.items,
                subtotal: group.subtotal,
                deliveryCharge: deliveryChargePerOrder,
                tax,
                total: orderTotal,
                deliveryAddress: finalizedAddress,
                paymentMethod,
                specialInstructions: deliveryInstructions,
                estimatedDeliveryTime,
                status: 'pending'
            };

            // Only assign pickupLocation if it properly has coordinates to satisfy MongoDB's 2dsphere index
            if (outlet && outlet.location && Array.isArray(outlet.location.coordinates) && outlet.location.coordinates.length === 2 && (outlet.location.coordinates[0] !== 0 || outlet.location.coordinates[1] !== 0)) {
                orderPayload.pickupLocation = outlet.location;
            }

            const order = new Order(orderPayload);

            await order.save();
            createdOrders.push(order);

            // Trigger background geocoding if location is missing
            if (!finalizedAddress.location) {
                setImmediate(() => {
                    processGeocoding(order._id, finalizedAddress.address);
                });
            }
        }

        // Clear cart after successful orders
        cart.items = [];
        await cart.save();

        const io = req.app.get('io');
        if (io) {
            createdOrders.forEach(order => {
                io.to(SOCKET_ROOMS.user(userId.toString())).emit(SOCKET_EVENTS.ORDER_CREATED, {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    total: order.total
                });
            });

            // Need to update stats carefully
            const newStats = await statsService.getStats();
            // Fire event for admins for each order created
            createdOrders.forEach(order => {
                const notificationData = {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    brand: order.brand,
                    total: order.total,
                    itemsCount: order.items.length,
                    createdAt: order.createdAt,
                    totalOrders: newStats.totalOrders,
                    pendingOrders: newStats.pendingOrders
                };
                io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.ORDER_NEW, notificationData);
                io.to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.ORDER_NEW, notificationData);
            });
        }

        // Return primarily the first orderId for frontend backward compatibility,
        // but include all orderIds and the combined total so Razorpay can capture the entire cart amount
        res.status(201).json({
            success: true,
            message: 'Order(s) placed successfully',
            data: {
                orderNumber: createdOrders[0].orderNumber,
                orderId: createdOrders[0]._id, // legacy frontend support
                orderIds: createdOrders.map(o => o._id), // new multi-brand support
                orders: createdOrders,
                total: grandTotalAllOrders,
                status: 'pending'
            }
        });

    } catch (error) {
        logger.error('Error during checkout', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to complete checkout',
            error: error.message
        });
    }
};
