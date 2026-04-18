import mongoose from 'mongoose';
import User from './User.js';

const customerSchema = new mongoose.Schema({
    addresses: [{
        label: {
            type: String,
            required: true,
            trim: true
        },
        addressLine: {
            type: String,
            required: true,
            trim: true
        },
        // Structured Fields for Editing
        flatNo: { type: String, trim: true },
        street: { type: String, trim: true },
        area: { type: String, trim: true },
        city: { type: String, trim: true },
        pincode: { type: String, trim: true },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    }],
    profileImage: {
        type: String,
        default: null
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        offers: { type: Boolean, default: true }
    }
});

const Customer = User.discriminator('Customer', customerSchema);

export default Customer;
