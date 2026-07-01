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
        sparse: true,
        lowercase: true,
        trim: true,
        default: null
    },

    mobile: {
        type: String,
        sparse: true, // Allow multiple null values without violating unique constraint
        trim: true,
        // default: null,
        validate: {
            validator: function (v) {
                // Allow null (for Google users who haven't provided phone yet)
                if (!v) return true;
                // Validates Indian mobile format (10 digits)
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
        type: {
            type: String,
            enum: ['Point'],
            // default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: undefined
        }
    },

    preferences: {
        activeBrand: {
            type: String,
            enum: ['teasntrees', 'littleh'],
            default: 'teasntrees'
        }
    },

    role: {
        type: String,
        enum: ['admin', 'customer', 'rider', 'manager'],
        required: true
    },
    brand: {
        type: String,
        enum: ['teasntrees', 'littleh'],
        required: function () {
            return ['admin', 'manager'].includes(this.role);
        }
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
    },
    fcmToken: {
        type: String,
        default: null
    },
    verificationPin: {
        type: String,
        default: () => Math.floor(1000 + Math.random() * 9000).toString()
    },

    // For Riders: Linked Manager
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can ref Manager (which is a User)
        default: null,
        index: true
    }

}, {
    timestamps: true,
    discriminatorKey: 'kind'
});

userSchema.index({ location: '2dsphere' });
userSchema.index({ mobile: 1, role: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1, role: 1 }, { unique: true, sparse: true });

userSchema.methods.checkProfileComplete = function () {
    return !!(this.name && this.email && this.address && this.role);
};

export default mongoose.model('User', userSchema);