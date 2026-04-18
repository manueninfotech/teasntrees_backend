// Customer Profile Routes
// Endpoint: /api/customer/profile

import express from 'express';
import { getProfile, updateProfile, updateBrandPreference, updateFCMToken } from '../../controllers/customer/profileController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// Customer profile routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/fcm-token', updateFCMToken);
router.put('/preferences/brand', updateBrandPreference);

export default router;
