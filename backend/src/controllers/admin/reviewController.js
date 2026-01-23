// Admin Review Management Controller
// For moderating and managing customer reviews

import Review from '../../models/Review.js';
import logger from '../../config/logger.js';
import mongoose from 'mongoose';

// Get all reviews with filters
export const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, productId, riderId, rating } = req.query;

        const query = {};

        if (status === 'approved') {
            query.isApproved = true;
        } else if (status === 'pending') {
            query.isApproved = false;
        }

        // Filter by Review Type
        const { type } = req.query;
        if (type === 'food') {
            query.$or = [
                { foodRating: { $exists: true } },
                { productRating: { $exists: true } }
            ];
        } else if (type === 'rider') {
            query.riderRating = { $exists: true };
        }

        if (productId) {
            query.productId = productId;
        }

        if (riderId) {
            query.riderId = riderId;
        }

        if (rating) {
            query.$or = [
                { foodRating: parseInt(rating) },
                { riderRating: parseInt(rating) },
                { productRating: parseInt(rating) }
            ];
        }

        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
            .populate('customerId', 'name mobile')
            .populate('orderId', 'orderNumber')
            .populate('productId', 'name')
            .populate('riderId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Review.countDocuments(query);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error in getAllReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

// Get review by ID
export const getReviewById = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId)
            .populate('customerId', 'name mobile email')
            .populate('orderId', 'orderNumber total items')
            .populate('productId', 'name image price')
            .populate('riderId', 'name mobile');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            data: review
        });

    } catch (error) {
        console.error('Error in getReviewById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review'
        });
    }
};

// Approve review
export const approveReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { isApproved: true },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        logger.info('Review approved', {
            reviewId,
            adminId: req.user.userId
        });

        // Notify Customer
        const socketService = req.app.get('socketService');
        if (socketService && review.customerId) {
            socketService.notifyUser(review.customerId.toString(), 'notification:new', {
                title: 'Review Approved',
                message: 'Your review has been approved and is now visible!',
                type: 'review',
                data: { reviewId }
            });
        }

        res.json({
            success: true,
            message: 'Review approved',
            data: review
        });

    } catch (error) {
        logger.error('Error approving review', { error: error.message });
        console.error('Error in approveReview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve review'
        });
    }
};

// Reject review
export const rejectReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { isApproved: false },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        logger.info('Review rejected', {
            reviewId,
            adminId: req.user.userId
        });

        // Notify Customer
        const socketService = req.app.get('socketService');
        if (socketService && review.customerId) {
            socketService.notifyUser(review.customerId.toString(), 'notification:new', {
                title: 'Review Update',
                message: 'Your review was not approved. Please check guidelines.',
                type: 'review',
                data: { reviewId }
            });
        }

        res.json({
            success: true,
            message: 'Review rejected',
            data: review
        });

    } catch (error) {
        logger.error('Error rejecting review', { error: error.message });
        console.error('Error in rejectReview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject review'
        });
    }
};

// Delete review
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndDelete(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        logger.info('Review deleted', {
            reviewId,
            adminId: req.user.userId
        });

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting review', { error: error.message });
        console.error('Error in deleteReview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
};

// Get rider ratings/reviews
export const getRiderReviews = async (req, res) => {
    try {
        const { riderId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const reviews = await Review.find({
            riderId,
            riderRating: { $exists: true },
            isApproved: true
        })
            .populate('customerId', 'name')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Review.countDocuments({
            riderId,
            riderRating: { $exists: true }
        });

        // Calculate average rating
        const avgResult = await Review.aggregate([
            { $match: { riderId: new mongoose.Types.ObjectId(riderId), riderRating: { $exists: true } } },
            { $group: { _id: null, avgRating: { $avg: '$riderRating' }, count: { $sum: 1 } } }
        ]);

        const avgRating = avgResult.length > 0 ? avgResult[0].avgRating.toFixed(1) : 0;
        const reviewCount = avgResult.length > 0 ? avgResult[0].count : 0;

        res.json({
            success: true,
            data: {
                reviews,
                averageRating: parseFloat(avgRating),
                totalReviews: reviewCount,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error in getRiderReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rider reviews'
        });
    }
};

// Get review statistics
export const getReviewStats = async (req, res) => {
    try {
        const totalReviews = await Review.countDocuments();
        const approvedReviews = await Review.countDocuments({ isApproved: true });
        const pendingReviews = await Review.countDocuments({ isApproved: false });

        // Average ratings
        const avgFoodRating = await Review.aggregate([
            { $match: { foodRating: { $exists: true } } },
            { $group: { _id: null, avg: { $avg: '$foodRating' } } }
        ]);

        const avgRiderRating = await Review.aggregate([
            { $match: { riderRating: { $exists: true } } },
            { $group: { _id: null, avg: { $avg: '$riderRating' } } }
        ]);

        const avgProductRating = await Review.aggregate([
            { $match: { productRating: { $exists: true } } },
            { $group: { _id: null, avg: { $avg: '$productRating' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalReviews,
                approvedReviews,
                pendingReviews,
                averageFoodRating: avgFoodRating.length > 0 ? avgFoodRating[0].avg.toFixed(1) : 0,
                averageRiderRating: avgRiderRating.length > 0 ? avgRiderRating[0].avg.toFixed(1) : 0,
                averageProductRating: avgProductRating.length > 0 ? avgProductRating[0].avg.toFixed(1) : 0
            }
        });

    } catch (error) {
        console.error('Error in getReviewStats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review statistics'
        });
    }
};
