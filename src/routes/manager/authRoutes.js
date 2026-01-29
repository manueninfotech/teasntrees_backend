// Manager Authentication Routes
// Endpoint: /api/manager/auth

import express from 'express';
import { sendOTP, verifyOTP, completeProfile, refreshAccessToken, logout } from '../../controllers/manager/authController.js';
import { authenticate } from '../../middlewares/auth.js';
import { otpLimiter, authLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes (with rate limiting)
router.post('/send-otp', otpLimiter, sendOTP);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/complete-profile', authLimiter, completeProfile);
router.post('/refresh-token', authLimiter, refreshAccessToken);

// Protected routes
router.post('/logout', authenticate, logout);

export default router;
