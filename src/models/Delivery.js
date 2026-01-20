import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
    deliveryNumber: {
        type: String,
        unique: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number],
        address: String
    },
    deliveryLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number],
        address: String
    },
    distance: {
        type: Number,
        required: true
    },
    estimatedTime: Number,
    status: {
        type: String,
        enum: ['assigned', 'accepted', 'rejected', 'heading_to_pickup', 'arrived_at_pickup', 'picked_up', 'in_transit', 'arrived', 'delivered', 'cancelled'],
        default: 'assigned'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: Date,
    rejectedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    // verification
    pickupOtp: String,
    deliveryOtp: String,

    // Earnings
    baseEarning: {
        type: Number,
        required: true
    },
    distanceBonus: {
        type: Number,
        default: 0
    },
    surgeBonus: {
        type: Number,
        default: 0
    },
    tipAmount: {
        type: Number,
        default: 0
    },
    totalEarning: {
        type: Number,
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: Date,

    // Metadata
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: String,
    notes: String,
    cancelReason: String,
    rejectionReason: String,
    deliveryProof: String,
}, {
    timestamps: true
});

deliverySchema.index({ riderId: 1, status: 1 });
deliverySchema.index({ deliveryNumber: 1 });
deliverySchema.index({ createdAt: -1 });

deliverySchema.pre('save', async function (next) {
    if (!this.deliveryNumber) {
        const count = await mongoose.model('Delivery').countDocuments();
        this.deliveryNumber = `DEL${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

export default mongoose.model('Delivery', deliverySchema);
