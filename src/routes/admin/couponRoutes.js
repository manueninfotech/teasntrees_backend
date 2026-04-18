import express from 'express';
import {
    getAllCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    toggleCoupon,
    deleteCoupon
} from '../../controllers/admin/couponController.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router({ mergeParams: true });

// List all coupons
router.get('/', getAllCoupons);

// Get single coupon
router.get('/:id', getCoupon);

// Create new coupon
router.post('/', logActivity('create', 'coupon'), createCoupon);

// Update coupon
router.put('/:id', logActivity('update', 'coupon'), updateCoupon);

// Toggle active / inactive
router.patch('/:id/toggle', logActivity('update', 'coupon'), toggleCoupon);

// Delete coupon
router.delete('/:id', logActivity('delete', 'coupon'), deleteCoupon);

export default router;
