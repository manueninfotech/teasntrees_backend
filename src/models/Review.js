import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    brand: {
        type: String,
        enum: ['teasntrees', 'littleh'],
        default: 'teasntrees',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider',
        required: false
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    foodRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    riderRating: {
        type: Number,
        required: false,
        min: 1,
        max: 5
    },
    productRating: {
        type: Number,
        required: false,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    images: [{
        type: String
    }],
    isApproved: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['order', 'product', 'site'],
        default: 'order'
    }
}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ orderId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Review', reviewSchema);