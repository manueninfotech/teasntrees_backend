import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    foodRating: {
        type: Number,
        min: 1,
        max: 5
    },
    riderRating: {
        type: Number,
        min: 1,
        max: 5
    },
    productRating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        maxlength: 500
    },
    images: [String],
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ orderId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);