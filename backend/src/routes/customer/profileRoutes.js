// Customer Profile Routes
// Endpoint: /api/customer/profile

import express from 'express';
import { getProfile, updateProfile } from '../../controllers/customer/profileController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer profile routes
router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
