import express from 'express';
import {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    assignDeliveryRider,
    cancelOrder,
    getOrderStats
} from '../../controllers/admin/orderController.js';
import {
    validateUpdateOrderStatus,
    validateAssignRider,
    validateOrderId
} from '../../middlewares/validators/orderValidator.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router();

// Get order stats (must be before /:id)
router.get('/stats', getOrderStats);

// Get all orders
router.get('/', getAllOrders);

// Get single order by id
router.get('/:id', validateOrderId, getOrderById);

//Update order status
router.put('/:id/status', validateUpdateOrderStatus, logActivity('update', 'order'), updateOrderStatus);

// Assign delivery rider
router.put('/:id/assign-rider', validateAssignRider, logActivity('assign', 'order'), assignDeliveryRider);

// Cancel order
router.put('/:id/cancel', validateOrderId, logActivity('cancel', 'order'), cancelOrder);

export default router;
