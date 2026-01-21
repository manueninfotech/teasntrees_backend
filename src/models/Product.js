import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: false,
        min: 0,
        default: 0
    },
    image: {
        type: String,
        default: 'default-image.jpg'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    preparationTime: {
        type: Number,
        default: 10
    },
    ingredients: [String],
    allergens: [String],
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: Number,
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    orderCount: {
        type: Number,
        default: 0
    },
    tags: {
        type: [String],
        enum: ['new-intro', 'must-try', 'best-seller', 'egg-contains'],
        default: []
    },
    isSeasonal: {
        type: Boolean,
        default: false
    },
    availableMonths: {
        type: [Number],
        validate: {
            validator: function (months) {
                return months.every(m => m >= 1 && m <= 12);
            },
            message: 'Months must be between 1 and 12'
        },
        default: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // All months by default
    },
    sizeOptions: [{
        size: String,
        price: Number
    }],
    variants: [{
        name: String,
        price: Number
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);