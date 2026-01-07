// User Routes

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers } = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update current user profile
router.put('/profile', authenticate, updateProfile);

// Get all users (Admin only)
router.get('/all', authenticate, getAllUsers);

module.exports = router;