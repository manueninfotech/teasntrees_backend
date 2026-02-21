// Customer Cart Controller
// Manage shopping cart for customers

import mongoose from 'mongoose';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import Settings from '../../models/Settings.js';
import Outlet from '../../models/Outlet.js';
import logger from '../../config/logger.js';
import { geocodingService } from '../../services/geocodingService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import { statsService } from '../../services/statsService.js';

// Get customer's cart
export const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        let cart = await Cart.findOne({ userId })
            .populate('items.product', 'name description image price isAvailable brand');

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
                customization,
                brand: product.brand || 'teasntrees'
            });
        }

        await cart.save();
        await cart.populate('items.product', 'name description image price isAvailable brand');

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
                    customization: item.customization
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

        const settings = await Settings.findOne();
        const deliveryChargePerOrder = settings ? settings.deliveryCharge : 50;
        const gstRate = settings ? settings.gstRate : 5;

        // --- NEW: Atomic Geocoding ---
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

        if (!finalizedAddress.location) {
            const coords = await geocodingService.getCoordinates(finalizedAddress.address);
            if (coords) {
                finalizedAddress.location = {
                    type: 'Point',
                    coordinates: [coords.lng, coords.lat]
                };
            }
        }

        const estimatedDeliveryTime = new Date();
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);

        // Fetch outlets for assigning pickup locations
        const outlets = await Outlet.find({ isActive: true });

        const createdOrders = [];
        let grandTotalAllOrders = 0;

        for (const [brand, group] of Object.entries(brandsGrouped)) {
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
