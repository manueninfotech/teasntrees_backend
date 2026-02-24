import Review from '../../models/Review.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Rider from '../../models/Rider.js';
import Product from '../../models/Product.js';
import logger from '../../config/logger.js';
import mongoose from 'mongoose';
import { notificationService } from '../../services/notificationService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';

const updateRiderRating = async (riderId) => {
    if (!riderId) return;
    try {
        const stats = await Review.aggregate([
            {
                $match: {
                    riderId: new mongoose.Types.ObjectId(riderId),
                    riderRating: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$riderRating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const avg = stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0;
        const count = stats.length > 0 ? stats[0].count : 0;

        await Rider.findByIdAndUpdate(riderId, {
            averageRating: avg,
            ratingsCount: count
        });
    } catch (error) {
        logger.error('Error updating rider rating:', error);
    }
};

const updateProductRating = async (productId) => {
    if (!productId) return;
    try {
        const stats = await Review.aggregate([
            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    $or: [
                        { productRating: { $exists: true, $ne: null } },
                        { foodRating: { $exists: true, $ne: null } }
                    ]
                }
            },
            {
                $project: {
                    rating: { $ifNull: ['$productRating', '$foodRating'] }
                }
            },
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const avg = stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0;
        const count = stats.length > 0 ? stats[0].count : 0;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avg,
            totalRatings: count
        });
    } catch (error) {
        logger.error('Error updating product rating:', error);
    }
};

// Submit review for order or site
export const createReview = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { orderId, foodRating, riderRating, review, images, rating, comment } = req.body;

        // If no orderId is provided, it's a general site review
        if (!orderId) {
            const finalRating = foodRating || rating;
            const finalReview = review || comment;

            if (!finalRating) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating is required'
                });
            }

            const newReview = await Review.create({
                customerId,
                brand: req.activeBrand || 'teasntrees',
                foodRating: finalRating,
                review: finalReview,
                images: images || [],
                type: 'site',
                isApproved: false
            });

            logger.info('General site review submitted', {
                reviewId: newReview._id,
                customerId
            });

            // Notify Admin
            const io = req.app.get('io');
            if (io) {
                io.to(SOCKET_ROOMS.role('admin')).emit('notification:new', {
                    title: 'New Site Review',
                    message: `A new general review was submitted by a customer`,
                    type: 'review',
                    data: { reviewId: newReview._id }
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Thank you for your feedback!',
                data: newReview
            });
        }

        // --- EXISTING ORDER REVIEW LOGIC ---
        const query = {
            _id: orderId,
            customerId
        };
        if (req.activeBrand) query.brand = req.activeBrand;

        const order = await Order.findOne(query);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Order is not delivered yet'
            });
        }

        // check if review already exists
        const existingReview = await Review.findOne({ orderId });
        if (existingReview) {
            existingReview.foodRating = foodRating;
            existingReview.riderRating = riderRating;
            existingReview.review = review;
            if (images) existingReview.images = images;
            existingReview.type = 'order';
            existingReview.isApproved = false;
            await existingReview.save();

            order.foodRating = foodRating;
            order.riderRating = riderRating;
            order.review = review;
            await order.save();

            await updateRiderRating(existingReview.riderId || order.riderId);
            await updateProductRating(existingReview.productId || (order.items && order.items.length > 0 ? order.items[0].product : null));

            return res.status(200).json({
                success: true,
                message: 'Review updated successfully',
                data: existingReview
            });
        }

        const newReview = await Review.create({
            orderId,
            customerId,
            brand: order.brand || req.activeBrand || 'teasntrees',
            riderId: order.riderId || null,
            productId: (order.items && order.items.length > 0) ? order.items[0].product : null,
            foodRating,
            riderRating,
            review,
            images: images || [],
            type: 'order',
            isApproved: false
        });

        order.foodRating = foodRating;
        order.riderRating = riderRating;
        order.review = review;
        await order.save();

        await updateRiderRating(newReview.riderId);
        await updateProductRating(newReview.productId);

        const io = req.app.get('io');
        if (io) {
            const socketData = {
                reviewId: newReview._id,
                orderId: order._id,
                orderNumber: order.orderNumber,
                foodRating,
                riderRating,
                review,
                customerId
            };
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.REVIEW_NEW, socketData);
            io.to(SOCKET_ROOMS.role('manager')).emit(SOCKET_EVENTS.REVIEW_NEW, socketData);
        }

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

        const productReview = await Review.findOneAndUpdate(
            { orderId, productId, customerId },
            {
                orderId,
                customerId,
                productId,
                productRating: rating,
                review,
                isApproved: false,
                type: 'product'
            },
            { upsert: true, new: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.REVIEW_NEW, {
                reviewId: productReview._id,
                orderId,
                productId,
                rating,
                review,
                type: 'product'
            });
        }

        res.json({
            success: true,
            message: 'Product rated successfully',
            data: productReview
        });
    } catch (error) {
        logger.error('Error rating product', { error: error.message });
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
        if (req.activeBrand) query.brand = req.activeBrand;

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

        const avgResult = await Review.aggregate([
            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    productRating: { $exists: true },
                    isApproved: true
                }
            },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$productRating' },
                    count: { $sum: 1 }
                }
            }
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product reviews'
        });
    }
};

// Get customer's reviews
export const getMyReviews = async (req, res) => {
    try {
        const customerId = new mongoose.Types.ObjectId(req.user.userId);
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const query = { customerId };
        if (req.activeBrand) query.brand = req.activeBrand;

        const reviews = await Review.find(query)
            .populate('orderId', 'orderNumber total')
            .populate('productId', 'name image')
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your reviews'
        });
    }
};

// Get site reviews (general feedback)
export const getSiteReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = {
            type: 'site',
            isApproved: true,
            foodRating: { $gte: 4 }
        };
        if (req.activeBrand) query.brand = req.activeBrand;

        const skip = (page - 1) * limit;
        const reviews = await Review.find(query)
            .populate('customerId', 'name')
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};
