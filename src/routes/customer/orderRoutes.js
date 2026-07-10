// Customer Order Routes
// Endpoint: /api/customer/orders

import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    reorder,
    downloadInvoice,
    createComplaint,
    updateOrderAddress
} from '../../controllers/customer/orderController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkProfileComplete } from '../../middlewares/profileGuard.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// Business-critical routes require complete profile
router.post('/', checkProfileComplete, createOrder);
router.post('/:orderId/reorder', checkProfileComplete, reorder);

// Get customer's orders
router.get('/my-orders', getMyOrders);

// Get single order
router.get('/:orderId/invoice', downloadInvoice);    // Download invoice
router.get('/:orderId', getOrderById);

// Cancel order
router.delete('/:orderId/cancel', cancelOrder);

// Raise an issue against an order (after a rider is assigned)
router.post('/:orderId/complaint', createComplaint);

// Edit delivery address (allowed until the rider picks up)
router.patch('/:orderId/address', updateOrderAddress);

export default router;
