import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    finalPrice: Number,
    weight: Number,
    isCustomized: {
        type: Boolean,
        default: false
    },
    isEggless: {
        type: Boolean,
        default: false
    },
    customization: {
        type: String,
        default: ''
    },
    customizationDetails: {
        cakeMessage: String,
        colorTheme: String,
        designDescription: String,
        referenceImage: String
    },
    brand: {
        type: String,
        enum: ['teasntrees', 'littleh'],
        default: 'teasntrees',
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    subtotal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate subtotal before saving
cartSchema.pre('save', async function () {
    this.subtotal = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
});

// Index for faster queries
cartSchema.index({ userId: 1 });

export default mongoose.model('Cart', cartSchema);
