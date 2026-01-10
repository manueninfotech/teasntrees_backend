import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTP } from '../utils/generateOTP.js';
import { generateToken } from '../utils/jwtHelper.js';
import otpConfig from '../config/otp.js';

/**
 * Send OTP to admin mobile number
 */
export const sendAdminOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validate mobile number
        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required'
            });
        }

        // Validate mobile format (10 digits)
        if (!/^[0-9]{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 10 digits.'
            });
        }

        // Check if user exists and is admin
        const existingUser = await User.findOne({ mobile });

        if (existingUser && existingUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'This mobile number is not registered as an admin'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Delete any existing OTP for this mobile
        await OTP.deleteMany({ mobile });

        // Save new OTP
        await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000)
        });

        // In production, send OTP via SMS service
        console.log(`Admin OTP for ${mobile}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            mobile,
            // Remove this in production
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Send admin OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
};

/**
 * Verify OTP and login/register admin
 */
export const verifyAdminOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        // Validation
        if (!mobile || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and OTP are required'
            });
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({ mobile, otp });

        if (!otpRecord) {
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP expired
        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(401).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check if user exists
        let user = await User.findOne({ mobile });

        if (user) {
            // Existing user - verify they are admin
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin credentials required.'
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin account has been deactivated'
                });
            }

        } else {
            // New user - create as admin
            user = await User.create({
                mobile,
                role: 'admin',
                isProfileComplete: false,
                isActive: true
            });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
        const token = generateToken({
            userId: user._id,
            role: user.role
        });

        // Prepare response
        const response = {
            success: true,
            message: user.isProfileComplete
                ? 'Admin login successful'
                : 'OTP verified. Please complete your profile.',
            token,
            user: {
                _id: user._id,
                mobile: user.mobile,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Verify admin OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed',
            error: error.message
        });
    }
};

/**
 * Get admin profile
 */
export const getAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

/**
 * Update admin profile
 * PUT /api/admin/auth/profile
 */
export const updateAdminProfile = async (req, res) => {
    try {
        const { name, email, address, location } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (address) user.address = address;
        if (location) user.location = location;

        // Check if profile is complete
        user.isProfileComplete = user.checkProfileComplete();

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

/**
 * Logout admin
 */
export const logoutAdmin = async (req, res) => {
    try {
        // Log the logout event for auditing
        console.log(`Admin logged out: ${req.user.userId} - ${req.user.role}`);

        // For now, just return success
        // The actual logout happens client-side by removing the JWT token
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};
