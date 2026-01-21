import express from 'express';
import { getPayoutStats, processPayout } from '../../controllers/admin/payoutController.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router();

// Protect all routes (Admin only)
router.use(authenticate);
router.use(checkRole(['admin', 'manager']));

router.get('/stats', getPayoutStats);
router.post('/process', processPayout);

export default router;
