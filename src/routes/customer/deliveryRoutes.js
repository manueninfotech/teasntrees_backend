// Customer Delivery Tracking Routes
// Endpoint: /api/customer/deliveries

import express from 'express';
import {
    getMyDeliveries,
    trackDelivery,
    getDeliveryByOrder
} from '../../controllers/customer/deliveryController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// Get customer's deliveries
router.get('/', getMyDeliveries);

// Track specific delivery
router.get('/:deliveryId/track', trackDelivery);

// Get delivery by order ID
router.get('/order/:orderId', getDeliveryByOrder);

export default router;
