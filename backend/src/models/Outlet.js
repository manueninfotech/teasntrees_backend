import mongoose from 'mongoose';

const outletSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        enum: ['teasntrees', 'littleh'],
        required: true
    },
    address: {
        type: String,
        required: true
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
            type: [Number],
            required: true // [longitude, latitude]
        }
    },
    contactPhone: {
        type: String
    },
    contactEmail: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create a geospatial index for location-based query (finding nearest riders)
outletSchema.index({ location: '2dsphere' });

export default mongoose.model('Outlet', outletSchema);
