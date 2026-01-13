// Customer Cart Controller
// Manage shopping cart for customers

import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import logger from '../../config/logger.js';

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
            // Add new item
            cart.items.push({
                product: productId,
                name: product.name,
                quantity,
                price: product.price,
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
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
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
