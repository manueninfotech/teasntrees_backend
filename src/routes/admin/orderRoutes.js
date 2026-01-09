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

// Get order stats (must be before /:id)
router.get('/stats', getOrderStats);

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

export default router;
