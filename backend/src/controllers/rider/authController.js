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

        const licensePhoto = files.licensePhoto ? files.licensePhoto[0].path : null;
        const aadharPhoto = files.aadharPhoto ? files.aadharPhoto[0].path : null;
        const panPhoto = files.panPhoto ? files.panPhoto[0].path : null;
        const profilePhoto = files.profilePhoto ? files.profilePhoto[0].path : null;

        if (!licensePhoto || !aadharPhoto) {
            return res.status(400).json({
                success: false,
                message: 'License and Aadhar photos are mandatory'
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
        const rider = await Rider.findOne({ mobile, role: 'rider' });

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found. Please register first.'
            });
        }

        const otp = generateOTP();
        // In production: await sendSMS(mobile, `Your login OTP is ${otp}`);

        // For dev/test:
        console.log(`Rider Login OTP for ${mobile}: ${otp}`);

        // Save OTP hash (assuming User model has method or separate OTP store, adapting from customer auth)
        // Reusing User model logic if available, or just mocking for this snippet if common logic exists.
        // Assuming common `Otp` model or field.
        // Let's assume we use the same `Otp` model as Customer/Admin.
        const Otp = (await import('../../models/OTP.js')).default;
        await Otp.create({ mobile, otp, role: 'rider' }); // role specific OTP?

        res.json({
            success: true,
            message: 'OTP sent successfully',
            // Convert to boolean for safety in prod
            otpSent: true
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const Otp = (await import('../../models/OTP.js')).default;

        const validOtp = await Otp.findOne({ mobile, otp, role: 'rider' });
        if (!validOtp) {
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

        rider.isOnline = isOnline;

        if (location) {
            rider.currentLocation = {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                lastUpdated: new Date()
            };
        }

        await rider.save();

        // Emit Socket Event (To be handled by socketService)
        const socketService = req.app.get('socketService');
        if (socketService) {
            const event = isOnline ? 'rider:online' : 'rider:offline';
            socketService.emitToRole('admin', event, {
                riderId: rider._id,
                name: rider.name,
                location: rider.currentLocation
            });
        }

        res.json({
            success: true,
            message: `You are now ${isOnline ? 'Online' : 'Offline'}`,
            data: { isOnline: rider.isOnline }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status' });
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
