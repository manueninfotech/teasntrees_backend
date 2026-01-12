// Authentication Routes

import express from 'express';
const router = express.Router();
import { sendOTP, verifyOTP, completeProfile, refreshAccessToken, logout } from '../controllers/authController.js';
import { otpLimiter, authLimiter } from '../middlewares/rateLimiter.js';

// POST Route to send otp to mobile number (strict rate limit)
router.post('/send-otp', otpLimiter, sendOTP);

// Route to verify otp and check user status (rate limited)
router.post('/verify-otp', authLimiter, verifyOTP);

// Route to complete user profile after otp verification
router.post('/complete-profile', completeProfile);

// Refresh access token (rate limited)
router.post('/refresh-token', authLimiter, refreshAccessToken);

// Logout
router.post('/logout', logout);

export default router;