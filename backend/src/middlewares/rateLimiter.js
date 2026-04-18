import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

const isDev = process.env.NODE_ENV === 'development';

// Helper for logging limit blocks
const onLimitReached = (limiterName) => (req, res, next, options) => {
    logger.warn(`Rate Limit Triggered: ${limiterName}`, {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
    });
    res.status(options.statusCode || 429).json(options.message);
};

// Strict rate limit for authentication routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100000 : 100, // Increased for dev/testing
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    handler: onLimitReached('AuthLimiter'),
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate rate limit for general API routes
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100000 : 1000, // Increased for dev/testing
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    handler: onLimitReached('ApiLimiter'),
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict rate limit for OTP requests
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100000 : 5, // Liberal in dev, strict in prod
    message: {
        success: false,
        message: 'Too many OTP requests, please try again after 15 minutes'
    },
    handler: onLimitReached('OtpLimiter'),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

// Admin route rate limit (more lenient)
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100000 : 200,
    message: {
        success: false,
        message: 'Too many requests, please slow down'
    },
    handler: onLimitReached('AdminLimiter'),
    standardHeaders: true,
    legacyHeaders: false,
});
