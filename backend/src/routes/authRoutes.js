// Authentication Routes

const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, completeProfile } = require('../controllers/authController');

// POST Route to send otp to mobile number
router.post('/send-otp', sendOTP);

// Route to verify otp and check user status
router.post('/verify-otp', verifyOTP);

// Route to complete user profile after otp verification
router.post('/complete-profile', completeProfile);

module.exports = router;