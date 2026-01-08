import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    deliveryCharge: {
        type: Number,
        default: 20
    },
    // freeDeliveryAbove: {
    //     type: Number,
    //     default: 500
    // },
    maxDeliveryDistance: {
        type: Number,
        default: 10
    },
    minimumOrderValue: {
        type: Number,
        default: 100
    },
    taxPercentage: {
        type: Number,
        default: 5
    },
    operatingHours: {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '09:00', close: '23:00', isOpen: true },
        sunday: { open: '09:00', close: '23:00', isOpen: true }
    },
    serviceAreas: [{
        name: String,
        coordinates: [[Number]],
        deliveryCharge: Number
    }],
    riderBaseEarning: {
        type: Number,
        default: 30
    },
    distanceBonusPerKm: {
        type: Number,
        default: 5
    },
    contactPhone: String,
    contactEmail: String,
    address: String,
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
})

export default mongoose.model('Settings', settingsSchema);