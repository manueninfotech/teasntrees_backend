const otpConfig = {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
    maxAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS) || 5
};

module.exports = otpConfig;
