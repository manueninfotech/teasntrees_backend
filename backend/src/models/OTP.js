// OTP model

const mongoose = require('mongoose');
const otpConfig = require('../config/otp');

const otpschema = new mongoose.Schema({
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

    otp: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        default: function () {
            return new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);
        }
    },

    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// TTL index - MongoDB automatically deletes documents after expiresAt
otpschema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * check if otp expired 
 * @returns {boolean} returns true if expired
 */

otpschema.methods.isExpired = function () {
    return this.expiresAt < new Date();
};

/**
 * check if otp is verified
 * @returns {boolean} returns true if verified
 */
otpschema.methods.isVerified = function () {
    return this.verified === true;
};

module.exports = mongoose.model('OTP', otpschema);
