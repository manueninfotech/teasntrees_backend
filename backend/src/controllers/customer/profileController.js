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
        // User ID is attached by auth middleware
        // Explicitly query as Customer to ensure all fields (like notificationPreferences) are available
        let user = await Customer.findById(req.user.userId).select('-__v');

        // Fallback: If not found as Customer (e.g. kind mismatch), try generic User
        if (!user) {
            user = await User.findById(req.user.userId).select('-__v');
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Debug
        console.log('[DEBUG] getProfile User Kind:', user.kind);
        console.log('[DEBUG] getProfile Prefs:', user.get('notificationPreferences'));
        console.log('[DEBUG] getProfile Prefs Direct:', user.notificationPreferences);

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

            // Fix: Mongoose subdocument spread might fail. Convert to object first if needed, 
            // or better yet, since we are doing Object.assign later, we need to be careful not to overwrite with incomplete object.
            // Safest way for partial update of nested object in Mongoose via Object.assign is to merge manually.
            const currentPrefs = user.notificationPreferences ? user.notificationPreferences.toObject() : {};

            updates.notificationPreferences = {
                ...currentPrefs, // keep existing
                ...notificationPreferences       // overwrite new
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

        console.log('[DEBUG] updateProfile applying updates:', updates);

        // Update user
        Object.assign(user, updates);

        // Check if profile is complete
        if (user.checkProfileComplete()) {
            user.isProfileComplete = true;
        }

        await user.save();
        console.log('[DEBUG] updateProfile saved user:', user.notificationPreferences);

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

export {
    getProfile,
    updateProfile
};