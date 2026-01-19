// User model

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: null
    },

    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        default: null
    },

    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Validates Indian mobile format (10 digits starting with 6-9)
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit mobile number!`
        }
    },

    address: {
        type: String,
        trim: true,
        default: null
    },

    location: {
        type: Object,
        default: null
    },

    role: {
        type: String,
        enum: ['admin', 'customer', 'rider', 'manager'],
        required: true
    },

    isProfileComplete: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Account lockout fields
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    isLocked: {
        type: Boolean,
        default: false
    },

    // Approval status (for manager/rider)
    isApproved: {
        type: Boolean,
        default: null  // null = not applicable (customer/admin), true/false for manager/rider
    }

}, {
    timestamps: true,
    discriminatorKey: 'kind'
});

userSchema.methods.checkProfileComplete = function () {
    return !!(this.name && this.email && this.address && this.role);
};

export default mongoose.model('User', userSchema);