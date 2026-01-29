import express from 'express';
import { getDashboardStats } from '../../controllers/manager/dashboardController.js';
import { authenticate } from '../../middlewares/auth.js';
import { isManager } from '../../middlewares/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(isManager);

router.get('/stats', getDashboardStats);

export default router;
