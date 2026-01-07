// Authentication Controller


const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP } = require('../utils/generateOTP');
const { generateToken } = require('../utils/jwtHelper');
const { isValidMobile, isValidEmail, isValidRole, isValidOTP, sanitizeString } = require('../utils/validators');

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
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
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
                expiresIn: '5 minutes',
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

            // Block after 5 failed attempts
            if (otpDoc.attempts >= 5) {
                await OTP.deleteOne({ _id: otpDoc._id });
                return res.status(429).json({
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
                attemptsRemaining: 5 - otpDoc.attempts
            });
        }

        // Mark OTP as verified
        otpDoc.verified = true;
        await otpDoc.save();

        // Check if user exists
        const existingUser = await User.findOne({ mobile });

        if (existingUser) {
            // User exists - check profile completion
            if (existingUser.isProfileComplete) {
                // Profile complete - generate token and login
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

/**
 * Complete user profile after OTP verification
 * 
 * POST /api/auth/complete-profile
 * Body: { mobile, name, email, address, role }
 */
const completeProfile = async (req, res) => {
    try {
        const { mobile, name, email, address, role } = req.body;

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
        if (!name || !email || !address || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, address, role'
            });
        }

        // Validate email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate role
        if (!isValidRole(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: admin, customer, rider, manager'
            });
        }

        // Sanitize inputs
        const sanitizedData = {
            mobile,
            name: sanitizeString(name),
            email: sanitizeString(email).toLowerCase(),
            address: sanitizeString(address),
            role,
            isProfileComplete: true
        };

        // Check if user already exists
        let user = await User.findOne({ mobile });

        if (user) {
            // Update existing user
            user.name = sanitizedData.name;
            user.email = sanitizedData.email;
            user.address = sanitizedData.address;
            user.role = sanitizedData.role;
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

module.exports = {
    sendOTP,
    verifyOTP,
    completeProfile
};