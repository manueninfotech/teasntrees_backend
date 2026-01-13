// Customer Cart Routes
// Endpoint: /api/customer/cart

import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} from '../../controllers/customer/cartController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get cart
router.get('/', getCart);

// Add item to cart
router.post('/add', addToCart);

// Update cart item quantity
router.put('/item/:itemId', updateCartItem);

// Remove item from cart
router.delete('/item/:itemId', removeCartItem);

// Clear cart
router.delete('/clear', clearCart);

export default router;
