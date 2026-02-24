import express from 'express';
import { getActiveDeliveries } from '../../controllers/manager/deliveryController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkRole(['manager']));

router.get('/active', getActiveDeliveries);

export default router;
