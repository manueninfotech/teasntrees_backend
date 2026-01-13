import express from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';
import { checkAdminIP } from '../../middlewares/ipWhitelist.js';

// Import all admin route modules
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import userRoutes from './userRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import activityRoutes from './activityRoutes.js';
import cartAnalyticsRoutes from './cartAnalyticsRoutes.js';
import reviewRoutes from './reviewRoutes.js';

const router = express.Router();

// Apply IP whitelist (production only), authentication, and admin role check
router.use(checkAdminIP);
router.use(authenticate);
router.use(checkRole(['admin']));

// Mount route modules
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);
router.use('/activity-logs', activityRoutes);
router.use('/analytics/carts', cartAnalyticsRoutes);
router.use('/reviews', reviewRoutes);

export default router;