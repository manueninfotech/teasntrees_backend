// Manager Authentication Routes
// Endpoint: /api/manager/auth

import express from 'express';
import { completeProfile, refreshAccessToken, logout, firebaseLogin } from '../../controllers/manager/authController.js';
import { authenticate } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router({ mergeParams: true });

// Public routes (with rate limiting)
router.post('/firebase-login', authLimiter, firebaseLogin);
router.post('/complete-profile', [authenticate, authLimiter], completeProfile);
router.post('/refresh-token', authLimiter, refreshAccessToken);

// Protected routes
router.post('/logout', authenticate, logout);

export default router;
