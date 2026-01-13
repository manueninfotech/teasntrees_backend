// Admin Cart Analytics Routes
// Endpoint: /api/admin/analytics/carts

import express from 'express';
import {
    getCartAnalytics,
    getAbandonedCarts
} from '../../controllers/admin/cartAnalyticsController.js';

const router = express.Router();

// Get cart analytics overview
router.get('/', getCartAnalytics);

// Get abandoned carts details
router.get('/abandoned', getAbandonedCarts);

export default router;
