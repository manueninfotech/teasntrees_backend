// Customer Cart Controller
// Manage shopping cart for customers

import mongoose from 'mongoose';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import Settings from '../../models/Settings.js';
import logger from '../../config/logger.js';
import { geocodingService } from '../../services/geocodingService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import { statsService } from '../../services/statsService.js';

// Get customer's cart
export const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        let cart = await Cart.findOne({ userId })
            .populate('items.product', 'name description image price isAvailable');

        // Create empty cart if doesn't exist
        if (!cart) {
            cart = await Cart.create({
                userId,
                items: [],
                subtotal: 0
            });
        }

        // Filter out unavailable products
        const availableItems = cart.items.filter(item =>
            item.product && item.product.isAvailable
        );

        if (availableItems.length !== cart.items.length) {
            cart.items = availableItems;
            await cart.save();
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
        console.error('Error in getCart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart'
        });
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, quantity = 1, customization = '' } = req.body;

        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!product.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Product is not available'
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({
                userId,
                items: []
            });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.customization === customization
        );

        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Determine the correct price (base price or size-specific price)
            let itemPrice = product.price;
            if (customization && product.sizeOptions && product.sizeOptions.length > 0) {
                const sizeOption = product.sizeOptions.find(opt => opt.size === customization);
                if (sizeOption) {
                    itemPrice = sizeOption.price;
                }
            }

            // Fallback to displayPrice if price is still missing (virtual field logic replicated)
            if (itemPrice === undefined || itemPrice === null) {
                if (product.sizeOptions && product.sizeOptions.length > 0) {
                    itemPrice = Math.min(...product.sizeOptions.map(opt => opt.price));
                } else {
                    itemPrice = product.price || 0;
                }
            }

            // Add new item
            cart.items.push({
                product: productId,
                name: product.name,
                quantity,
                price: itemPrice,
                customization
            });
        }

        await cart.save();
        await cart.populate('items.product', 'name description image price isAvailable');

        logger.info('Item added to cart', {
            userId,
            productId,
            quantity
        });

        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            data: {
                items: cart.items,
                subtotal: cart.subtotal,
                itemCount: cart.items.length
            }
        });

    } catch (error) {
        logger.error('Error adding to cart', { error: error.message });
        console.error('Error in addToCart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart'
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

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.product', 'name description image price isAvailable');

        logger.info('Cart item updated', {
            userId,
            itemId,
            quantity
        });

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
        console.error('Error in updateCartItem:', error);
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

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            // Cart already empty/non-existent, consider success
            return res.status(200).json({
                success: true,
                message: 'Cart cleared',
                data: {
                    items: [],
                    subtotal: 0,
                    itemCount: 0
                }
            });
        }

        cart.items = [];
        await cart.save();

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

        // Validate all items are still available
        const unavailableItems = [];
        const orderItems = [];

        for (const item of cart.items) {
            if (!item.product || !item.product.isAvailable) {
                unavailableItems.push(item.name);
            } else {
                orderItems.push({
                    product: item.product._id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    customization: item.customization
                });
            }
        }

        if (unavailableItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some items are no longer available',
                unavailableItems
            });
        }

        // Calculate totals
        const subtotal = cart.subtotal;
        // Fetch dynamic delivery charge (and other settings like tax if needed)
        const settings = await Settings.findOne();
        const deliveryCharge = settings ? settings.deliveryCharge : 20; // Fallback to 20
        const tax = subtotal * 0.05;
        const total = subtotal + deliveryCharge + tax;

        // --- NEW: Atomic Geocoding with Diagnostics ---
        let finalizedAddress = typeof deliveryAddress === 'object' ? {
            address: deliveryAddress.address || deliveryAddress.addressLine,
            location: deliveryAddress.location || { type: 'Point', coordinates: [0, 0] }
        } : {
            address: deliveryAddress,
            location: { type: 'Point', coordinates: [0, 0] }
        };

        console.log(`[Checkout] Processing GPS for address: "${finalizedAddress.address}"`);
        console.log(`[Checkout] Initial coordinates: [${finalizedAddress.location?.coordinates}]`);

        // If no coordinates, try to geocode
        if (!finalizedAddress.location.coordinates ||
            finalizedAddress.location.coordinates.length < 2 ||
            (finalizedAddress.location.coordinates[0] === 0 && finalizedAddress.location.coordinates[1] === 0)) {

            console.log(`[Checkout] GPS missing/null. Fetching from Geocoding Service...`);
            const coords = await geocodingService.getCoordinates(finalizedAddress.address);

            if (coords) {
                finalizedAddress.location = {
                    type: 'Point',
                    coordinates: [coords.lng, coords.lat] // [Lng, Lat] for MongoDB
                };
                console.log(`[Checkout] Geocoding SUCCESS: [${coords.lng}, ${coords.lat}]`);
            } else {
                console.warn(`[Checkout] Geocoding FAILED for: ${finalizedAddress.address}. No GPS available.`);
            }
        } else {
            console.log(`[Checkout] Using existing GPS: [${finalizedAddress.location.coordinates}]`);
        }

        // Set estimated delivery time (default 45 mins from now)
        const estimatedDeliveryTime = new Date();
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);

        // Create order
        const order = await Order.create({
            customerId: userId,
            items: orderItems,
            subtotal,
            deliveryCharge,
            tax,
            total,
            deliveryAddress: finalizedAddress,
            paymentMethod,
            specialInstructions: deliveryInstructions,
            estimatedDeliveryTime,
            status: 'pending'
        });

        // Clear cart after successful order
        cart.items = [];
        await cart.save();

        logger.info('Order created from cart', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId: userId,
            total
        });

        // Diagnostic log for the user to confirm database connection
        console.log(`ORDER PERSISTED SUCCESS: ${order.orderNumber} in DB: ${mongoose.connection.name}`);

        // Emit socket event
        try {
            // Update Dashboard Stats immediately
            await statsService.increment('totalOrders');
            await statsService.increment('pendingOrders');

            // Emit socket event DIRECTLY

            const io = req.app.get('io');
            if (io) {
                // Notify Customer
                io.to(SOCKET_ROOMS.user(userId.toString())).emit(SOCKET_EVENTS.ORDER_CREATED, {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    total: order.total
                });

                // Notify Admin & Manager
                const notificationData = {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    total: order.total,
                    itemsCount: order.items.length,
                    createdAt: order.createdAt,
                    // Include updated stats
                    totalOrders: (await statsService.getStats()).totalOrders,
                    pendingOrders: (await statsService.getStats()).pendingOrders
                };

                io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.ORDER_NEW, notificationData);
                io.to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.ORDER_NEW, notificationData);
            }

        } catch (socketError) {
            console.error('Socket notification error (checkout continuing):', socketError);
            logger.warn('Socket notification failed during checkout', { error: socketError.message });
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
        logger.error('Error during checkout', { error: error.message });
        console.error('Error in checkoutCart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete checkout',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
