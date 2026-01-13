import express from 'express';
import {
    createReview,
    rateProduct,
    getProductReviews,
    getMyReviews
} from '../../controllers/customer/reviewController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.use(authenticate);
router.post('/', createReview);
router.post('/product', rateProduct);
router.get('/my-reviews', getMyReviews);

export default router;