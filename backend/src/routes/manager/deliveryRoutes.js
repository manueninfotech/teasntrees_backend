import express from 'express';
import { getDeliveries } from '../../controllers/manager/deliveryController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkRole(['manager']));

router.get('/', getDeliveries);
router.get('/active', (req, res) => {
    req.query.type = 'active';
    getDeliveries(req, res);
});

export default router;
