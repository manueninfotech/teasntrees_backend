// Customer Profile Controller
// Endpoint: /api/customer/profile
// Role: 'customer' only

import User from '../../models/User.js';
import Customer from '../../models/Customer.js'; // Import Customer to ensure discriminator registration
import { isValidEmail, sanitizeString } from '../../utils/validators.js';
import { geocodingService } from '../../services/geocodingService.js';

// Get current user profile
const getProfile = async (req, res) => {
    try {
        let user = await Customer.findById(req.user.userId).select('-__v');

        if (!user) {
            user = await User.findById(req.user.userId).select('-__v');
        }

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
                    profileImage: user.profileImage,
                    // safe access to notificationPreferences using .get() or direct access
                    notificationPreferences: user.get ? user.get('notificationPreferences') : user.notificationPreferences,
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
        const { name, email, address, notificationPreferences, profileImage } = req.body;
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

            // Attempt to geocode new address
            try {
                const coords = await geocodingService.getCoordinates(sanitizedAddress);
                if (coords) {
                    updates.location = {
                        type: 'Point',
                        coordinates: [coords.lng, coords.lat]
                    };
                }
            } catch (error) {
                console.warn('Geocoding failed during profile update:', error);
                // Continue without updating location
            }
        }

        if (notificationPreferences !== undefined) {
            // Validate notificationPreferences object
            if (typeof notificationPreferences !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Notification preferences must be an object'
                });
            }

            const currentPrefs = user.notificationPreferences ? user.notificationPreferences.toObject() : {};

            updates.notificationPreferences = {
                ...currentPrefs,
                ...notificationPreferences
            };
        }

        if (profileImage !== undefined) {
            // Basic validation - check if string (URL)
            updates.profileImage = profileImage;
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
                    email: user.email,
                    address: user.address,
                    location: user.location,
                    profileImage: user.profileImage,
                    // Include customer specific fields if available
                    notificationPreferences: user.notificationPreferences || undefined,
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

// Update active brand preference
const updateBrandPreference = async (req, res) => {
    try {
        const { brand } = req.body;
        const userId = req.user.userId;

        if (!brand || !['teasntrees', 'littleh'].includes(brand)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing brand. Must be teasntrees or littleh'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.preferences) {
            user.preferences = {};
        }

        user.preferences.activeBrand = brand;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Brand preference updated successfully',
            data: {
                activeBrand: user.preferences.activeBrand
            }
        });

    } catch (error) {
        console.error('Error updating brand preference:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update brand preference'
        });
    }
};

export {
    getProfile,
    updateProfile,
    updateBrandPreference
};