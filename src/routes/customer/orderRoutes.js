// Customer Order Routes
// Endpoint: /api/customer/orders

import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    reorder,
    downloadInvoice
} from '../../controllers/customer/orderController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkProfileComplete } from '../../middlewares/profileGuard.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Business-critical routes require complete profile
router.post('/', checkProfileComplete, createOrder);
router.post('/:orderId/reorder', checkProfileComplete, reorder);

// Get customer's orders
router.get('/my-orders', getMyOrders);

// Get single order
router.post('/:orderId/reorder', reorder);         // Reorder
router.get('/:orderId/invoice', downloadInvoice);    // Download invoice
router.get('/:orderId', getOrderById);

// Cancel order
router.delete('/:orderId/cancel', cancelOrder);

export default router;
