import express from 'express';
import {
    sendAdminOTP,
    verifyAdminOTP,
    getAdminProfile,
    updateAdminProfile,
    logoutAdmin
} from '../controllers/adminAuthController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/roleCheck.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendAdminOTP);
router.post('/verify-otp', verifyAdminOTP);

// Protected routes (require authentication and admin role)
router.use(authenticate, isAdmin);

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.post('/logout', logoutAdmin);

export default router;
