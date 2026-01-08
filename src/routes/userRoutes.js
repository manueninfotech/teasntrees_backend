// User Routes

import express from 'express';
const router = express.Router();
import { getProfile, updateProfile, getAllUsers } from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';
import { checkRole } from '../middlewares/roleCheck.js';

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update current user profile
router.put('/profile', authenticate, updateProfile);

// Get all users (Admin only)
router.get('/all', authenticate, checkRole(['admin']), getAllUsers);

export default router;