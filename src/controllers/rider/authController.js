import Rider from '../../models/Rider.js';
import User from '../../models/User.js';
import { generateOTP } from '../../utils/generateOTP.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../../config/logger.js';

// Register a new Rider
export const registerRider = async (req, res) => {
    try {
        const {
            name, mobile, email,
            vehicleType, vehicleNumber, vehicleModel,
            bankAccountNumber, ifscCode, accountHolderName,
            emergencyContactName, emergencyContactMobile, emergencyContactRelation
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already registered'
            });
        }

        // Check for duplicate vehicle/license if needed (optional but recommended)
        const existingVehicle = await Rider.findOne({ vehicleNumber });
        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number already registered'
            });
        }


        const files = req.files || {};

        // Accept either file uploads OR URLs from request body
        const licensePhoto = files.licensePhoto ? files.licensePhoto[0].path : req.body.licensePhoto;
        const aadharPhoto = files.aadharPhoto ? files.aadharPhoto[0].path : req.body.aadharPhoto;
        const panPhoto = files.panPhoto ? files.panPhoto[0].path : req.body.panPhoto;
        const profilePhoto = files.profilePhoto ? files.profilePhoto[0].path : req.body.profilePhoto;

        if (!licensePhoto || !aadharPhoto) {
            return res.status(400).json({
                success: false,
                message: 'License and Aadhar photos are mandatory (either upload files or provide URLs)'
            });
        }

        // Create Rider
        const rider = new Rider({
            name,
            mobile,
            email,
            role: 'rider',
            isApproved: false, // Pending admin approval
            isActive: true,

            // Vehicle
            vehicleType,
            vehicleNumber,
            vehicleModel,

            // Documents
            licenseNumber: req.body.licenseNumber,
            licenseExpiryDate: req.body.licenseExpiryDate,
            licensePhoto,

            aadharNumber: req.body.aadharNumber,
            aadharPhoto,

            panNumber: req.body.panNumber,
            panPhoto,

            // Profile
            image: profilePhoto,

            // Bank
            bankAccountNumber,
            ifscCode,
            accountHolderName,

            // Emergency
            emergencyContact: {
                name: emergencyContactName,
                mobile: emergencyContactMobile,
                relation: emergencyContactRelation
            }
        });

        await rider.save();

        res.status(201).json({
            success: true,
            message: 'Rider registered successfully. Waiting for admin approval.',
            riderId: rider._id
        });

    } catch (error) {
        logger.error('Rider Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Send OTP (Standard Auth)
export const sendOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        const rider = await Rider.findOne({ mobile });

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found. Please register first.'
            });
        }

        if (!rider.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for approval before logging in.'
            });
        }

        const otp = generateOTP();

        // Delete any existing OTPs for this mobile
        const Otp = (await import('../../models/OTP.js')).default;
        await Otp.deleteMany({ mobile });

        // Create new OTP
        await Otp.create({
            mobile,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // For dev/test:
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Rider Login OTP for ${mobile}: ${otp}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpSent: true
        });

    } catch (error) {
        logger.error('Rider Send OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const Otp = (await import('../../models/OTP.js')).default;

        let validOtp = await Otp.findOne({ mobile, otp });

        // dev bypass
        const isBypass = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && otp === '123456';

        if (!validOtp && !isBypass) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        const rider = await Rider.findOne({ mobile });
        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider account not found' });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: rider._id, role: 'rider' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Clear OTP
        await Otp.deleteMany({ mobile });

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            rider: {
                _id: rider._id,
                name: rider.name,
                isApproved: rider.isApproved,
                isOnline: rider.isOnline
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

// Toggle Online/Offline Status
export const toggleAvailability = async (req, res) => {
    try {
        const { isOnline, location } = req.body; // location: { lat, lng }
        const rider = req.rider; // From middleware

        if (!rider) {
            logger.error('Rider not found in request', { userId: req.user?.userId });
            return res.status(401).json({
                success: false,
                message: 'Rider not authenticated'
            });
        }

        rider.isOnline = isOnline;

        if (location) {
            rider.currentLocation = {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                lastUpdated: new Date()
            };
        }

        await rider.save();

        // Emit Socket Event (optional - only if socketService exists and has the method)
        try {
            const socketService = req.app?.get?.('socketService');
            if (socketService && typeof socketService.emitToRole === 'function') {
                const event = isOnline ? 'rider:online' : 'rider:offline';
                socketService.emitToRole('admin', event, {
                    riderId: rider._id,
                    name: rider.name,
                    location: rider.currentLocation
                });
            }
        } catch (socketError) {
            logger.warn('Socket emission failed (non-critical):', socketError.message);
            // Continue anyway - this is not critical
        }

        res.json({
            success: true,
            message: `You are now ${isOnline ? 'Online' : 'Offline'}`,
            data: { isOnline: rider.isOnline }
        });

    } catch (error) {
        logger.error('Error in toggleAvailability:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update status',
            error: error.message 
        });
    }
};

// Get Profile
export const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.rider
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed' });
    }
};
