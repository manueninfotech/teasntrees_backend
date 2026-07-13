// Admin Review Routes
// Endpoint: /api/admin/reviews

import express from 'express';
import {
    getAllReviews,
    getReviewById,
    approveReview,
    rejectReview,
    deleteReview,
    getRiderReviews,
    getReviewStats,
    syncAllRatings
} from '../../controllers/admin/reviewController.js';

const router = express.Router({ mergeParams: true });

// Sync all product ratings
router.post('/sync', syncAllRatings);

// Get all reviews with filters
router.get('/', getAllReviews);

// Get review statistics
router.get('/stats', getReviewStats);

// Get rider reviews
router.get('/rider/:riderId', getRiderReviews);

// Get review by ID
router.get('/:reviewId', getReviewById);

// Approve review
router.patch('/:reviewId/approve', approveReview);

// Reject review
router.patch('/:reviewId/reject', rejectReview);

// Delete review
router.delete('/:reviewId', deleteReview);

export default router;
