// Authentication Routes

import express from 'express';
const router = express.Router();
import { sendOTP, verifyOTP, completeProfile } from '../controllers/authController.js';

// POST Route to send otp to mobile number
router.post('/send-otp', sendOTP);

// Route to verify otp and check user status
router.post('/verify-otp', verifyOTP);

// Route to complete user profile after otp verification
router.post('/complete-profile', completeProfile);

export default router;