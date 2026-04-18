import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        enum: ['teasntrees', 'littleh'],
        default: 'teasntrees',
        required: true
    },
    description: String,
    icon: String,
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

categorySchema.index({ name: 1, brand: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);