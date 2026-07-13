import express from 'express';
import { getCustomers, getCustomerOrders } from '../../controllers/manager/customerController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkRole(['manager']));

router.get('/', getCustomers);
router.get('/:id/orders', getCustomerOrders);

export default router;
