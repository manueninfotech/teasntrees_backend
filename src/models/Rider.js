import mongoose from 'mongoose';
import User from './User.js';

const riderSchema = new mongoose.Schema({
    // Vehicle Details
    vehicleType: {
        type: String,
        enum: ['bike', 'scooter', 'bicycle', 'electric_scooter'],
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true,
        trim: true
    },
    vehicleModel: {
        type: String,
        trim: true
    },

    // Legal Documents (URLs to images/PDFs)
    licenseNumber: { type: String },
    licenseExpiryDate: { type: Date },
    licensePhoto: { type: String }, // URL

    aadharNumber: { type: String },
    aadharPhoto: { type: String }, // URL

    panNumber: { type: String },
    panPhoto: { type: String }, // URL

    // Bank Details (For Payouts)
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },

    // Emergency Contact
    emergencyContact: {
        name: String,
        mobile: String,
        relation: String
    },

    // Status & Availability
    isOnline: {
        type: Boolean,
        default: false
    },
    isOnDelivery: {
        type: Boolean,
        default: false
    },
    lockUntil: {
        type: Date,
        default: null,
        index: true
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0] // [longitude, latitude]
        },
        lastUpdated: { type: Date }
    },

    // Performance Stats
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },

    performanceMetrics: {
        acceptanceRate: { type: Number, default: 100 },
        completionRate: { type: Number, default: 100 },
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 }
    },

    // Operational Preferences
    preferredZones: [String],
    maxDeliveriesPerDay: { type: Number, default: 30 }

}, {
    discriminatorKey: 'kind',
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Index for geospatial queries (finding nearest rider)
riderSchema.index({ currentLocation: '2dsphere' });
riderSchema.index({ isOnline: 1, isOnDelivery: 1, isApproved: 1 });

const Rider = User.discriminator('Rider', riderSchema);

export default Rider;
