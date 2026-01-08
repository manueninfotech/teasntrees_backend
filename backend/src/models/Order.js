import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        quantity: Number,
        price: Number,
        customization: String
    }],
    subtotal: Number,
    deliveryCharge: Number,
    tax: Number,
    total: {
        type: Number,
        required: true
    },
    deliveryAddress: {
        address: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    riderEarning: Number,
    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
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
    review: String,
    specialInstructions: String,
    estimatedDeliveryTime: Date,
    deliveredAt: Date,
    cancelReason: String
}, {
    timestamps: true
});

orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

export default mongoose.model('Order', orderSchema);