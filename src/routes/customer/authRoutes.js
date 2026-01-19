// Customer Authentication Routes
// Endpoint: /api/customer/auth

import express from 'express';
import { sendOTP, verifyOTP, completeProfile, refreshAccessToken, logout } from '../../controllers/customer/authController.js';
import { authenticate } from '../../middlewares/auth.js';
import { otpLimiter, authLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes (with rate limiting)
router.post('/send-otp', otpLimiter, sendOTP);          // 3 req/hour
router.post('/verify-otp', authLimiter, verifyOTP);     // 5 req/15min
router.post('/refresh-token', authLimiter, refreshAccessToken);

// Protected routes (require authentication)
// Public route (security handled by OTP verification)
router.post('/complete-profile', completeProfile);
router.post('/logout', authenticate, logout);

export default router;
