// Admin Profile Controller
// Endpoint: /api/admin/profile
// Role: 'admin' only

import User from '../../models/User.js';
import { isValidEmail, sanitizeString } from '../../utils/validators.js';

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

export {
    getProfile,
    updateProfile
};