import express from 'express';
import {
    getRiders,
    approveRider,
    suspendRider,
    rejectRider
} from '../../controllers/manager/riderController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(checkRole(['manager']));

router.get('/', getRiders);
router.put('/:id/approve', approveRider);
router.put('/:id/suspend', suspendRider);
router.delete('/:id/reject', rejectRider);

export default router;
