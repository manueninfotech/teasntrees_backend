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
        ref: 'Product'
    }]
});

const Customer = User.discriminator('Customer', customerSchema);

export default Customer;
