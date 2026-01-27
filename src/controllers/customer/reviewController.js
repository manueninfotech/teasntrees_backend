import Review from '../../models/Review.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import logger from '../../config/logger.js';
import mongoose from 'mongoose';
import { notificationService } from '../../services/notificationService.js';

// Submit review for order
export const createReview = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { orderId, foodRating, riderRating, review, images } = req.body;
        // verify order belongs to customer and is delivered
        const order = await Order.findOne({
            _id: orderId,
            customerId,
            status: 'delivered'
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not delivered yet'
            });
        }
        // check if review already exists
        const existingReview = await Review.findOne({ orderId });
        if (existingReview) {
            // NEW: Check if the existing review itself is incomplete/corrupted
            if (!existingReview.foodRating || !existingReview.riderRating) {
                console.log('EXISTING REVIEW IS CORRUPT. OVERWRITING WITH NEW DATA...');

                existingReview.foodRating = foodRating;
                existingReview.riderRating = riderRating;
                existingReview.review = review;
                if (images) existingReview.images = images;

                // DATA FIX: Ensure required fields are present (Schema Validation Fix)
                if (!existingReview.riderId && order.riderId) existingReview.riderId = order.riderId;
                if (!existingReview.productId && order.items && order.items.length > 0) {
                    existingReview.productId = order.items[0].product;
                }

                // Reset approval status on update/fix
                existingReview.isApproved = false;

                await existingReview.save();

                // Now heal the order
                order.foodRating = foodRating;
                order.riderRating = riderRating;
                order.review = review;
                await order.save();

                console.log('CORRUPTION FIXED. SAVED NEW RATINGS.');

                return res.status(200).json({
                    success: true,
                    message: 'Review updated successfully',
                    data: existingReview
                });
            }

            console.log('DUPLICATE REVIEW FOUND - STARTING SELF-HEAL CHECK for Order:', orderId);

            // Self-healing: Ensure order has the ratings even if previously failed
            if (!order.foodRating || !order.riderRating) {
                console.log('ORDER MISSING RATINGS -> HEALING NOW...');
                order.foodRating = existingReview.foodRating;
                order.riderRating = existingReview.riderRating;
                order.review = existingReview.review;
                await order.save();
                logger.info('Self-healed order ratings from existing review', { orderId });
                console.log('HEALING COMPLETE');
            } else {
                console.log('ORDER ALREADY HAS RATINGS. No healing needed.');
            }

            return res.status(200).json({
                success: true,
                message: 'Review already submitted (Auto-Healed)',
                data: existingReview
            });
        }
        // create review
        const newReview = await Review.create({
            orderId,
            customerId,
            riderId: order.riderId,
            productId: (order.items && order.items.length > 0) ? order.items[0].product : null, // REQUIRED by Schema
            foodRating,
            riderRating,
            review,
            images: images || [],
            isApproved: false // Explicitly ensure pending
        });
        // update order with ratings
        order.foodRating = foodRating;
        order.riderRating = riderRating;
        order.review = review;
        await order.save();

        logger.info('Review submitted', {
            reviewId: newReview._id,
            orderId,
            customerId
        });
        // Notify Admin
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('admin', 'notification:new', {
                title: 'New Review Submitted',
                message: `New review for Order #${order.orderNumber}`,
                type: 'review',
                data: { reviewId: newReview._id, orderId }
            });
            socketService.notifyRole('manager', 'notification:new', {
                title: 'New Review Submitted',
                message: `New review for Order #${order.orderNumber}`,
                type: 'review',
                data: { reviewId: newReview._id, orderId }
            });
        }

        // Push Notification to Admin/Manager
        try {
            const admins = await User.find({ role: { $in: ['admin', 'manager'] } });
            await notificationService.sendPushToMany(admins, {
                title: 'New Review',
                body: `Review received for Order #${order.orderNumber}. Food: ${foodRating}/5, Rider: ${riderRating}/5`,
                data: { type: 'new_review', reviewId: newReview._id }
            });
        } catch (pushErr) {
            logger.error('Failed to send review push notify:', pushErr);
        }

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: newReview
        });
    } catch (error) {
        logger.error('Error creating review', { error: error.message });
        console.error('Error in createReview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review: ' + error.message,
        });
    }
};

// Rate specific product
export const rateProduct = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { productId, rating, review, orderId } = req.body;
        // verify customer ordered this product
        const order = await Order.findOne({
            _id: orderId,
            customerId,
            'items.product': productId
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'You have not ordered this product'
            });
        }
        // create/update product review
        const productReview = await Review.findOneAndUpdate({ orderId, productId, customerId },
            {
                orderId,
                customerId,
                productId,
                productRating: rating,
                review,
                isApproved: false // Reset to pending on update
            },
            { upsert: true, new: true }
        );
        logger.info('Product rated', {
            productId,
            rating,
            customerId
        });
        res.json({
            success: true,
            message: 'Product rated successfully',
            data: productReview
        });
    } catch (error) {
        logger.error('Error rating product', { error: error.message });
        console.error("Error in rateProduct:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to rate product'
        });
    }
};

// Get product reviews
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, rating } = req.query;

        const query = {
            productId,
            isApproved: true,
            productRating: { $exists: true }
        };
        if (rating) {
            query.productRating = parseInt(rating);
        }
        const skip = (page - 1) * limit;
        const reviews = await Review.find(query)
            .populate('customerId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        const total = await Review.countDocuments(query);
        // calculate average rating (ONLY for approved reviews)
        const avgResult = await Review.aggregate([
            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    productRating: { $exists: true },
                    isApproved: true // FIX: Only include approved reviews in average
                }
            },
            { $group: { _id: null, avgRating: { $avg: '$productRating' }, count: { $sum: 1 } } }
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
        console.error("Error in getProductReviews:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product reviews'
        });
    }
};

// Get customer's reviews
export const getMyReviews = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const reviews = await Review.find({ customerId })
            .populate('orderId', 'orderNumber total')
            .populate('productId', 'name image')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Review.countDocuments({ customerId });

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
        console.error('Error in getMyReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your reviews'
        });
    }
};