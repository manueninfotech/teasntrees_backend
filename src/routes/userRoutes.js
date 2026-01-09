// User Routes

import express from 'express';
const router = express.Router();
import { getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update current user profile
router.put('/profile', authenticate, updateProfile);

export default router;