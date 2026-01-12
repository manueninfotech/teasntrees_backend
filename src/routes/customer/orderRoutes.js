// Customer Order Routes
// Endpoint: /api/customer/orders

import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder
} from '../../controllers/customer/orderController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create order
router.post('/', createOrder);

// Get customer's orders
router.get('/my-orders', getMyOrders);

// Get single order
router.get('/:orderId', getOrderById);

// Cancel order
router.delete('/:orderId/cancel', cancelOrder);

export default router;
