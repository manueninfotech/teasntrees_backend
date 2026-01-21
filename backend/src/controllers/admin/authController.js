// Admin Authentication Controller
// Role: 'admin' (auto-assigned)
// App: Admin Panel

import User from '../../models/User.js';
import OTP from '../../models/OTP.js';
import RefreshToken from '../../models/RefreshToken.js';
import { generateOTP } from '../../utils/generateOTP.js';
import { generateToken, generateRefreshToken } from '../../utils/jwtHelper.js';
import { isValidMobile, isValidEmail, isValidRole, isValidOTP, sanitizeString } from '../../utils/validators.js';
import otpConfig from '../../config/otp.js';
import logger from '../../config/logger.js';

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
        console.log(`OTP for ${mobile}: ${otp}`);
        console.log(`Expires at: ${otpDoc.expiresAt}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Also log with Winston for visibility
        logger.info('OTP Generated', { mobile, otp, expiresAt: otpDoc.expiresAt });

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
        // Bypass for test account in development
        console.log('DEBUG verifyOTP:', {
            env: process.env.NODE_ENV,
            mobile,
            otp,
            isDev: process.env.NODE_ENV === 'development',
            matchMobile: mobile === '9999999999',
            matchOtp: otp === '123456'
        });

        // Check if OTP matches
        // Bypass for test account in development
        const isTestBypass = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
            String(mobile) === '9999999999' &&
            String(otp) === '123456';

        if (otpDoc.otp !== otp && !isTestBypass) {
            // Increment OTP attempts
            otpDoc.attempts += 1;
            await otpDoc.save();

            // Track failed login attempts if user exists
            const failedUser = await User.findOne({ mobile });
            if (failedUser) {
                failedUser.loginAttempts += 1;

                // Lock account after 5 failed attempts
                if (failedUser.loginAttempts >= 5) {
                    failedUser.isLocked = true;
                    failedUser.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                    await failedUser.save();

                    logger.warn('Account locked due to failed login attempts', {
                        userId: failedUser._id,
                        mobile: failedUser.mobile,
                        attempts: failedUser.loginAttempts
                    });

                    await OTP.deleteOne({ _id: otpDoc._id });
                    return res.status(423).json({
                        success: false,
                        message: 'Account locked for 30 minutes due to too many failed attempts.'
                    });
                }

                await failedUser.save();
                logger.warn('Failed login attempt', {
                    userId: failedUser._id,
                    mobile: failedUser.mobile,
                    attempts: failedUser.loginAttempts
                });
            }

            // Block after max OTP failed attempts
            if (otpDoc.attempts >= otpConfig.maxAttempts) {
                await OTP.deleteOne({ _id: otpDoc._id });
                return res.status(429).json({
                    success: false,
                    message: 'Too many failed OTP attempts. Please request a new OTP.'
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
            // Check if account is locked
            if (existingUser.isLocked && existingUser.lockUntil > new Date()) {
                const minutesLeft = Math.ceil((existingUser.lockUntil - new Date()) / (60 * 1000));
                logger.warn('Login attempt on locked account', {
                    userId: existingUser._id,
                    mobile: existingUser.mobile,
                    minutesRemaining: minutesLeft
                });
                return res.status(423).json({
                    success: false,
                    message: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`
                });
            }

            // Reset lock if time expired
            if (existingUser.lockUntil && existingUser.lockUntil < new Date()) {
                existingUser.isLocked = false;
                existingUser.loginAttempts = 0;
                existingUser.lockUntil = null;
                await existingUser.save();
                logger.info('Account auto-unlocked', { userId: existingUser._id });
            }

            // Check if account is active
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

                // Generate refresh token
                const refreshToken = generateRefreshToken();

                // Store refresh token in database
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 90); // 90 days

                await RefreshToken.create({
                    token: refreshToken,
                    user: existingUser._id,
                    expiresAt,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });

                logger.info('User login successful', {
                    userId: existingUser._id,
                    mobile: existingUser.mobile,
                    role: existingUser.role
                });

                // Reset login attempts on successful login
                existingUser.loginAttempts = 0;
                existingUser.isLocked = false;
                existingUser.lockUntil = null;
                await existingUser.save();

                // Delete OTP after successful verification
                await OTP.deleteOne({ _id: otpDoc._id });

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        token,
                        refreshToken,
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
            role: 'admin',  // LOCKED: Admin panel always creates admins
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

        // Generate refresh token
        const refreshToken = generateRefreshToken();

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90); // 90 days

        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Delete OTP after profile completion
        await OTP.deleteOne({ _id: otpDoc._id });

        return res.status(201).json({
            success: true,
            message: 'Profile completed successfully',
            data: {
                token,
                refreshToken,
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
            logger.warn('Refresh token missing in request');
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Find token in database
        const storedToken = await RefreshToken.findOne({
            token: refreshToken,
            isRevoked: false
        }).populate('user');

        if (!storedToken) {
            logger.warn('Invalid refresh token attempt', { token: refreshToken.substring(0, 20) });
            return res.status(401).json({
                success: false,
                message: 'Invalid or revoked refresh token'
            });
        }

        // Check expiry
        if (storedToken.expiresAt < new Date()) {
            logger.warn('Expired refresh token', { userId: storedToken.user._id });
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired. Please login again.'
            });
        }

        // Check if user is still active
        if (!storedToken.user.isActive) {
            logger.warn('Refresh attempt by deactivated user', { userId: storedToken.user._id });
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // TOKEN ROTATION: Revoke old token
        storedToken.isRevoked = true;
        storedToken.revokedAt = new Date();

        const newRefreshToken = generateRefreshToken();
        storedToken.replacedBy = newRefreshToken;
        await storedToken.save();

        // Create new refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await RefreshToken.create({
            token: newRefreshToken,
            user: storedToken.user._id,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Generate new access token
        const accessToken = generateToken({
            userId: storedToken.user._id,
            role: storedToken.user.role
        });

        logger.info('Token refreshed successfully', { userId: storedToken.user._id });

        res.json({
            success: true,
            token: accessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        logger.error('Error in refreshAccessToken', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
};


const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            const result = await RefreshToken.updateOne(
                { token: refreshToken },
                {
                    isRevoked: true,
                    revokedAt: new Date()
                }
            );

            logger.info('User logged out', {
                tokenRevoked: result.modifiedCount > 0
            });
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error('Error in logout', { error: error.message });
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