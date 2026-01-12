import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'create', 'update', 'delete',
            'activate', 'deactivate',
            'login', 'logout',
            'assign', 'cancel'
        ]
    },
    resource: {
        type: String,
        required: true,
        enum: ['user', 'product', 'category', 'order', 'delivery', 'settings', 'auth']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: String,
    userAgent: String,
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: String
}, {
    timestamps: true
});

// Indexes for efficient queries
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, action: 1 });
activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
