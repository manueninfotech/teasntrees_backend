import express from 'express';
import {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    assignDeliveryRider,
    cancelOrder,
    getOrderStats
} from '../../controllers/admin/orderController.js';
import {
    validateUpdateOrderStatus,
    validateOrderId
} from '../../middlewares/validators/orderValidator.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router({ mergeParams: true });

// Get order stats (must be before /:id)
router.get('/stats', getOrderStats);

// Get all orders
router.get('/', getAllOrders);

// Get single order by id
router.get('/:id', validateOrderId, getOrderById);

//Update order status
router.put('/:id/status', validateUpdateOrderStatus, updateOrderStatus);

// Update payment status
router.put('/:id/payment-status', validateOrderId, updatePaymentStatus);

// Assign rider
router.put('/:id/assign-rider', validateOrderId, assignDeliveryRider);

// Cancel order
router.put('/:id/cancel', validateOrderId, cancelOrder);

export default router;
