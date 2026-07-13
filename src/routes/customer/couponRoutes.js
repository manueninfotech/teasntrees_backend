import express from 'express';
import { validateCoupon, getAvailableCoupons } from '../../controllers/customer/couponController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// GET /customer/coupons — public, no auth needed
router.get('/', getAvailableCoupons);

// Protected routes below
router.use(authenticate);

// POST /customer/coupons/validate
router.post('/validate', validateCoupon);

export default router;
