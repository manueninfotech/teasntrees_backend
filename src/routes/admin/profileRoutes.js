// Admin Profile Routes
// Endpoint: /api/admin/profile

import express from 'express';
import { getProfile, updateProfile } from '../../controllers/admin/profileController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// Admin profile routes
router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
