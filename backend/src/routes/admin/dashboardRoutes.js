import express from 'express';
import {
    getDashboardStats,
    getRevenueAnalytics,
    getTopProducts,
    getRecentOrders
} from '../../controllers/admin/dashboardController.js';

const router = express.Router({ mergeParams: true });

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get revenue analytics
router.get('/revenue', getRevenueAnalytics);

// Get top selling products
router.get('/top-products', getTopProducts);

// Get recent orders
router.get('/recent-orders', getRecentOrders);

export default router;
