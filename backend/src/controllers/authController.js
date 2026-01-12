// Authentication Controller

import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTP } from '../utils/generateOTP.js';
import { generateToken } from '../utils/jwtHelper.js';
import { isValidMobile, isValidEmail, isValidRole, isValidOTP, sanitizeString } from '../utils/validators.js';
import otpConfig from '../config/otp.js';

// Send OTP to mobile number

const sendOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validate mobile number
        if (!mobile || !isValidMobile(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit mobile number'
            });
        }

        // Generate 6-digit OTP
        const otp = generateOTP();

        // Delete any existing OTPs for this mobile
        await OTP.deleteMany({ mobile });

        // Save new OTP to database
        const otpDoc = await OTP.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000)
        });

        // TODO: Send OTP via SMS (Twilio integration)
        // For now, just log to console for development
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📱 OTP for ${mobile}: ${otp}`);
        console.log(`⏰ Expires at: ${otpDoc.expiresAt}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                mobile,
                expiresIn: `${otpConfig.expiryMinutes} minutes`,
                // Only include OTP in development mode
                ...(process.env.NODE_ENV === 'development' && { otp })
            }
        });

    } catch (error) {
        console.error('Error in sendOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        });
    }
};

// Verify OTP and check user status

const verifyOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        // Validate inputs
        if (!mobile || !isValidMobile(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid mobile number'
            });
        }

        if (!otp || !isValidOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit OTP'
            });
        }

        // Find OTP in database
        const otpDoc = await OTP.findOne({ mobile }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found. Please request a new OTP.'
            });
        }

        // Check if OTP is expired
        if (otpDoc.isExpired()) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Check if OTP matches
        if (otpDoc.otp !== otp) {
            // Increment attempts
            otpDoc.attempts += 1;
            await otpDoc.save();

            // Block after max failed attempts
            if (otpDoc.attempts >= otpConfig.maxAttempts) {
                await OTP.deleteOne({ _id: otpDoc._id });
                return res.status(429).json({
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
                attemptsRemaining: otpConfig.maxAttempts - otpDoc.attempts
            });
        }

        // Mark OTP as verified
        otpDoc.verified = true;
        await otpDoc.save();

        // Check if user exists
        const existingUser = await User.findOne({ mobile });

        if (existingUser) {
            // User exists - check if account is active
            if (!existingUser.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
            }

            // Check profile completion
            if (existingUser.isProfileComplete) {
                // Profile complete - generate tokens and login
                const token = generateToken({
                    userId: existingUser._id,
                    role: existingUser.role
                });

                // Delete OTP after successful verification
                await OTP.deleteOne({ _id: otpDoc._id });

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        token,
                        user: {
                            id: existingUser._id,
                            name: existingUser.name,
                            mobile: existingUser.mobile,
                            email: existingUser.email,
                            role: existingUser.role,
                            isProfileComplete: true
                        }
                    }
                });
            } else {
                // Profile incomplete - prompt to complete
                return res.status(200).json({
                    success: true,
                    message: 'OTP verified. Please complete your profile.',
                    data: {
                        mobile,
                        isNewUser: false,
                        isProfileComplete: false,
                        existingData: {
                            name: existingUser.name,
                            email: existingUser.email,
                            address: existingUser.address,
                            role: existingUser.role
                        }
                    }
                });
            }
        } else {
            // New user - prompt to complete profile
            return res.status(200).json({
                success: true,
                message: 'OTP verified. Please complete your profile.',
                data: {
                    mobile,
                    isNewUser: true,
                    isProfileComplete: false
                }
            });
        }

    } catch (error) {
        console.error('Error in verifyOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify OTP. Please try again.'
        });
    }
};

// Complete user profile after OTP verification
const completeProfile = async (req, res) => {
    try {
        const { mobile, name, email, address } = req.body;

        // Validate mobile
        if (!mobile || !isValidMobile(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number'
            });
        }

        // Check if OTP was verified for this mobile
        const otpDoc = await OTP.findOne({ mobile, verified: true }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: 'Please verify OTP first'
            });
        }

        // Check if OTP is still valid (within 10 minutes of verification)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (otpDoc.createdAt < tenMinutesAgo) {
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({
                success: false,
                message: 'OTP verification expired. Please request a new OTP.'
            });
        }

        // Validate required fields
        if (!name || !email || !address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, address'
            });
        }

        // Validate email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Sanitize inputs
        const sanitizedData = {
            mobile,
            name: sanitizeString(name),
            email: sanitizeString(email).toLowerCase(),
            address: sanitizeString(address),
            role: 'customer',  // Default to customer for backward compatibility
            isProfileComplete: true
        };

        // Check if user already exists
        let user = await User.findOne({ mobile });

        if (user) {
            // Update existing user (but don't change role if already set)
            user.name = sanitizedData.name;
            user.email = sanitizedData.email;
            user.address = sanitizedData.address;
            // Only set role if user doesn't have one
            if (!user.role) {
                user.role = sanitizedData.role;
            }
            user.isProfileComplete = true;
            await user.save();
        } else {
            // Create new user
            user = await User.create(sanitizedData);
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id,
            role: user.role
        });

        // Delete OTP after profile completion
        await OTP.deleteOne({ _id: otpDoc._id });

        return res.status(201).json({
            success: true,
            message: 'Profile completed successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    address: user.address,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete
                }
            }
        });

    } catch (error) {
        console.error('Error in completeProfile:', error);

        // Handle duplicate email error
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to complete profile. Please try again.'
        });
    }
};

// Refresh access token using refresh token
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Note: Since we're not using refresh tokens yet in Phase 1,
        // this is a placeholder for future implementation
        // For now, just return an error
        return res.status(501).json({
            success: false,
            message: 'Refresh token feature coming soon. Please login again.'
        });

    } catch (error) {
        console.error('Error in refreshAccessToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        // For now, logout is stateless (JWT invalidation would require redis/database)
        // Future: Implement token blacklist or refresh token revocation

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Error in logout:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to logout'
        });
    }
};

export {
    sendOTP,
    verifyOTP,
    completeProfile,
    refreshAccessToken,
    logout
};