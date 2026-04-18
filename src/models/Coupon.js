import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        description: {
            type: String,
            default: ''
        },

        discountType: {
            type: String,
            enum: ['percentage', 'flat'],
            required: true
        },

        discountAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // For percentage coupons: optional max cap on discount (e.g. max ₹100 off)
        maxDiscount: {
            type: Number,
            default: null
        },

        minOrderValue: {
            type: Number,
            default: 0
        },

        // Which brand this coupon applies to (null = all brands)
        brand: {
            type: String,
            enum: ['teasntrees', 'littleh', null],
            default: null
        },

        // Limit total uses (null = unlimited)
        usageLimit: {
            type: Number,
            default: null
        },

        // Track how many times it has been used
        usedCount: {
            type: Number,
            default: 0
        },

        // Limit per user (null = unlimited)
        perUserLimit: {
            type: Number,
            default: 1
        },

        // Track per-user usage: [{ userId, count }]
        userUsage: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                count: { type: Number, default: 0 }
            }
        ],

        // First-order only coupon (e.g. HELLO100)
        firstOrderOnly: {
            type: Boolean,
            default: false
        },

        expiryDate: {
            type: Date,
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

couponSchema.index({ isActive: 1, expiryDate: 1 });

export default mongoose.model('Coupon', couponSchema);
