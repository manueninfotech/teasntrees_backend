import Review from '../../models/Review.js';
import Order from '../../models/Order.js';
import logger from '../../config/logger.js';
import mongoose from 'mongoose';

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
            return res.status(400).json({
                success: false,
                message: 'Review already submitted for this order'
            });
        }
        // create review
        const newReview = await Review.create({
            orderId,
            customerId,
            riderId: order.riderId,
            foodRating,
            riderRating,
            review,
            images: images || []
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
            message: 'Failed to submit review',
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
            'items.productId': productId
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
                review
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
        // calculate average rating
        const avgResult = await Review.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId), productRating: { $exists: true } } },
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