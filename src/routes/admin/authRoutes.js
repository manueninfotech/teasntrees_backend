// Admin Authentication Routes
// Endpoint: /api/admin/auth

import express from 'express';
import { completeProfile, refreshAccessToken, logout, firebaseLogin } from '../../controllers/admin/authController.js';
import { authenticate } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router({ mergeParams: true });

// Public routes (with rate limiting)
router.post('/firebase-login', authLimiter, firebaseLogin);
router.post('/complete-profile', [authenticate, authLimiter], completeProfile);
router.post('/refresh-token', authLimiter, refreshAccessToken);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);

export default router;
