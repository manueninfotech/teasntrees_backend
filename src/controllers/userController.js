// User Controller

const User = require('../models/User');
const { isValidEmail, sanitizeString } = require('../utils/validators');

// Get current user profile
const getProfile = async (req, res) => {
    try {
        // User ID is attached by auth middleware
        const user = await User.findById(req.user.userId).select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    address: user.address,
                    location: user.location,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Error in getProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, email, address } = req.body;
        const userId = req.user.userId;

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate and update fields if provided
        const updates = {};

        if (name !== undefined) {
            const sanitizedName = sanitizeString(name);
            if (!sanitizedName) {
                return res.status(400).json({
                    success: false,
                    message: 'Name cannot be empty'
                });
            }
            updates.name = sanitizedName;
        }

        if (email !== undefined) {
            const sanitizedEmail = sanitizeString(email).toLowerCase();
            if (!isValidEmail(sanitizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address'
                });
            }
            updates.email = sanitizedEmail;
        }

        if (address !== undefined) {
            const sanitizedAddress = sanitizeString(address);
            if (!sanitizedAddress) {
                return res.status(400).json({
                    success: false,
                    message: 'Address cannot be empty'
                });
            }
            updates.address = sanitizedAddress;
        }

        // Check if there are any updates
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Update user
        Object.assign(user, updates);

        // Check if profile is complete
        if (user.checkProfileComplete()) {
            user.isProfileComplete = true;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    address: user.address,
                    location: user.location,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                    updatedAt: user.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Error in updateProfile:', error);

        // Handle duplicate email error
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const { role, limit = 50, page = 1 } = req.query;

        // Build query filter
        const filter = {};
        if (role) {
            filter.role = role;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get users
        const users = await User.find(filter)
            .select('-__v')
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ createdAt: -1 });

        // Get total count
        const total = await User.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Error in getAllUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getAllUsers
};