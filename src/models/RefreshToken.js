import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    revokedAt: Date,
    replacedBy: String,
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Compound index for efficient queries
refreshTokenSchema.index({ user: 1, isRevoked: 1 });

// TTL index - MongoDB will automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
