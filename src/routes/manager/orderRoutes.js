import express from 'express';
import { getOrders, updateOrderStatus, getOrderDetails, assignRider } from '../../controllers/manager/orderController.js';
import { authenticate } from '../../middlewares/auth.js';
import { isManager } from '../../middlewares/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(isManager);

// Order Management
router.get('/', getOrders); // View orders
router.get('/:orderId', getOrderDetails); // View details
router.put('/:orderId/status', updateOrderStatus); // Update status
router.put('/:orderId/assign-rider', assignRider); // Assign rider

export default router;
