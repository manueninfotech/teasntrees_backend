import express from 'express';
import {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    assignDeliveryRider,
    cancelOrder,
    getOrderStats
} from '../../controllers/admin/orderController.js';

const router = express.Router();

// Get all orders
router.get('/', getAllOrders);

// Get single order by id
router.get('/:id', getOrderById);

// Update order status
router.put('/:id/status', updateOrderStatus);

// Assign delivery rider
router.put('/:id/assign-rider', assignDeliveryRider);

// Cancel order
router.put('/:id/cancel', cancelOrder);

// Get order stats
router.get('/stats', getOrderStats);
