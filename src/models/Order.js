import mongoose from 'mongoose';

/* ----------------------------------
   STATUS CONSTANTS
----------------------------------- */
const BUSINESS_STATUSES = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'waiting_for_rider',
    'cancelled'
];

const LOGISTICS_STATUSES = [
    'assigned',
    'out-for-delivery',
    'in_transit',
    'delivered'
];

const TERMINAL_STATUSES = ['delivered', 'cancelled'];

const ALL_STATUSES = [...BUSINESS_STATUSES, ...LOGISTICS_STATUSES];


/* ----------------------------------
   ORDER SCHEMA
----------------------------------- */
const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true
        },

        brand: {
            type: String,
            enum: ['teasntrees', 'littleh'],
            default: 'teasntrees',
            required: true
        },

        outletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Outlet'
            // To be made required after migration
        },

        pickupLocation: {
            type: {
                type: String,
                enum: ['Point']
                // No default: 'Point' to avoid invalid GeoJSON with missing coordinates
            },
            coordinates: [Number] // [lng, lat]
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
            customization: String,
            customizationDetails: {
                cakeMessage: String,
                colorTheme: String,
                designDescription: String,
                referenceImage: String
            }
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
                    enum: ['Point']
                },
                coordinates: [Number] // [lng, lat]
            }
        },

        riderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        handledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        riderEarning: Number,

        status: {
            type: String,
            enum: ALL_STATUSES,
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

        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        razorpaySignature: { type: String, default: null },

        foodRating: { type: Number, min: 1, max: 5 },
        riderRating: { type: Number, min: 1, max: 5 },

        review: String,
        specialInstructions: String,

        estimatedDeliveryTime: Date,

        confirmedAt: Date,
        assignedAt: Date,
        outForDeliveryAt: Date,
        deliveredAt: Date,
        cancelledAt: Date,

        cancelReason: String,

        timeline: [{
            status: String,
            timestamp: { type: Date, default: Date.now },
            description: String
        }]
    },
    {
        timestamps: true
    });

/* ----------------------------------
   INDEXES
----------------------------------- */
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ brand: 1, createdAt: -1 });
orderSchema.index({ 'deliveryAddress.location': '2dsphere' });
orderSchema.index({ pickupLocation: '2dsphere' });

/* ----------------------------------
   ORDER NUMBER GENERATION
----------------------------------- */
orderSchema.pre('save', async function () {
    if (this.orderNumber) return;

    const Counter = mongoose.model('Counter');

    const counter = await Counter.findOneAndUpdate(
        { name: 'order' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.orderNumber = `ORD${String(counter.seq).padStart(6, '0')}`;
});

/* ----------------------------------
   TERMINAL STATUS PROTECTION
----------------------------------- */
orderSchema.pre('save', async function () {
    if (!this.isModified('status')) return;
    if (this.isNew) return;

    const previous = await this.constructor
        .findById(this._id)
        .select('status')
        .lean();

    if (
        previous &&
        TERMINAL_STATUSES.includes(previous.status) &&
        previous.status !== this.status
    ) {
        throw new Error('Cannot change status after terminal state');
    }
});

/* ----------------------------------
   LOGISTICS STATUS GUARD
   Only Delivery model is allowed to set
   logistics statuses. This prevents
   conflicting writes from controllers.
----------------------------------- */
orderSchema.pre('save', async function () {
    if (!this.isModified('status')) return;

    if (
        LOGISTICS_STATUSES.includes(this.status) &&
        !this.$locals?.allowDeliverySync
    ) {
        throw new Error('Logistics status can only be updated by Delivery sync');
    }
});


/* ----------------------------------
   EXPORT
----------------------------------- */
export default mongoose.model('Order', orderSchema);
