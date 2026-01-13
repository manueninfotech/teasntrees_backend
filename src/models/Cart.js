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
    customization: {
        type: String,
        default: ''
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
cartSchema.pre('save', function (next) {
    this.subtotal = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    next();
});

// Index for faster queries
cartSchema.index({ userId: 1 });

export default mongoose.model('Cart', cartSchema);
