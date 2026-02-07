import Rider from '../../models/Rider.js';
import User from '../../models/User.js';
import { generateOTP } from '../../utils/generateOTP.js';
import { riderMetricsService } from "../../services/riderMetricsService.js";
import { SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../../config/logger.js';
import { riderAssignmentService } from '../../services/riderAssignmentService.js';
import activityLogService from '../../services/activityLogService.js';

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

// Send OTP (Simplified for onboarding)
export const sendOtp = async (req, res) => {
    try {
        const { mobile } = req.body;

        // Find existing user or just continue if new
        const rider = await Rider.findOne({ mobile });

        // If rider exists but is not approved, we might want to block login 
        // OR allow them to see status. Let's allow login to check status.

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
        console.log(`Rider Auth OTP for ${mobile}: ${otp}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpSent: true,
            isNewUser: !rider
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

        let rider = await Rider.findOne({ mobile });

        // If it's a new rider (completely new mobile), we can create a skeleton here
        // or wait for completeProfile. Let's create a placeholder to get an ID.
        if (!rider) {
            rider = new Rider({
                mobile,
                role: 'rider',
                isApproved: false,
                isProfileComplete: false,
                vehicleType: 'bike', // default placeholder
                vehicleNumber: 'PENDING',
                licenseNumber: 'PENDING',
                licenseExpiryDate: new Date(),
                aadharNumber: 'PENDING'
            });
            await rider.save();
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
                isOnline: rider.isOnline,
                isProfileComplete: rider.isProfileComplete || false
            }
        });

    } catch (error) {
        logger.error('Rider Verify OTP Error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

// Complete Profile
export const completeProfile = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const {
            name, email, address, location,
            vehicleType, vehicleNumber, vehicleModel,
            bankAccountNumber, ifscCode, accountHolderName,
            emergencyContactName, emergencyContactMobile, emergencyContactRelation,
            licenseNumber, licenseExpiryDate, aadharNumber, panNumber
        } = req.body;

        const rider = await Rider.findById(riderId);
        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        const files = req.files || {};

        // Update basic info
        rider.name = name || rider.name;
        rider.email = email || rider.email;
        rider.address = address || rider.address;

        let parsedLocation = location;
        if (typeof location === 'string') {
            try {
                parsedLocation = JSON.parse(location);
            } catch (e) {
                console.error('Failed to parse location:', e);
            }
        }

        // --- NEW: Location Fallback (Geocode manual address if no GPS coordinates) ---
        const { geocodingService } = await import('../../services/geocodingService.js');

        let targetCoords = null;

        if (parsedLocation && parsedLocation.lng && parsedLocation.lat) {
            targetCoords = [parseFloat(parsedLocation.lng), parseFloat(parsedLocation.lat)];
        } else if (rider.address || address) {
            // No coordinates provided, try to geocode the manual address
            const searchAddress = address || rider.address;
            console.log(`[Rider] Attempting fallback geocoding for: ${searchAddress}`);
            const coords = await geocodingService.getCoordinates(searchAddress);
            if (coords) {
                targetCoords = [coords.lng, coords.lat];
            }
        }

        if (targetCoords) {
            const locObj = {
                type: 'Point',
                coordinates: targetCoords
            };
            rider.location = locObj;
            rider.currentLocation = {
                ...locObj,
                lastUpdated: new Date()
            };
        }

        // Vehicle info
        rider.vehicleType = vehicleType || rider.vehicleType;
        rider.vehicleNumber = vehicleNumber || rider.vehicleNumber;
        rider.vehicleModel = vehicleModel || rider.vehicleModel;

        // Documents numbers
        rider.licenseNumber = licenseNumber || rider.licenseNumber;
        if (licenseExpiryDate) rider.licenseExpiryDate = new Date(licenseExpiryDate);
        rider.aadharNumber = aadharNumber || rider.aadharNumber;
        rider.panNumber = panNumber || rider.panNumber;

        // Document photos
        if (files.licensePhoto) rider.licensePhoto = files.licensePhoto[0].path;
        if (files.aadharPhoto) rider.aadharPhoto = files.aadharPhoto[0].path;
        if (files.panPhoto) rider.panPhoto = files.panPhoto[0].path;
        if (files.profilePhoto) rider.image = files.profilePhoto[0].path;

        // Bank info
        rider.bankAccountNumber = bankAccountNumber || rider.bankAccountNumber;
        rider.ifscCode = ifscCode || rider.ifscCode;
        rider.accountHolderName = accountHolderName || rider.accountHolderName;

        // Emergency contact
        if (emergencyContactName || emergencyContactMobile || emergencyContactRelation) {
            rider.emergencyContact = {
                name: emergencyContactName || rider.emergencyContact?.name,
                mobile: emergencyContactMobile || rider.emergencyContact?.mobile,
                relation: emergencyContactRelation || rider.emergencyContact?.relation
            };
        }

        rider.isProfileComplete = true;
        // Keep isApproved: false until admin checks

        await rider.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'complete_profile',
            resource: 'user',
            resourceId: rider._id,
            details: { name: rider.name, role: 'rider' }
        });

        res.json({
            success: true,
            message: 'Profile completed successfully. Pending administrator approval.',
            rider: {
                _id: rider._id,
                name: rider.name,
                isApproved: rider.isApproved,
                isProfileComplete: rider.isProfileComplete
            }
        });

    } catch (error) {
        logger.error('Complete Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete profile',
            error: error.message
        });
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

        const updateFields = { isOnline: isOnline };
        if (location) {
            updateFields.currentLocation = {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                lastUpdated: new Date()
            };
        }

        await Rider.findByIdAndUpdate(rider._id, { $set: updateFields });

        // Log Activity
        await activityLogService.log(req, {
            action: isOnline ? 'activate' : 'deactivate',
            resource: 'user',
            resourceId: rider._id,
            details: { name: rider.name, role: 'rider', type: 'availability' }
        });

        // Emit Socket Event DIRECTLY
        try {
            const io = req.app.get('io');
            if (io) {
                const event = isOnline ? 'rider:online' : 'rider:offline';
                io.to(SOCKET_ROOMS.role('admin')).emit(event, {
                    riderId: rider._id,
                    name: rider.name,
                    location: rider.currentLocation
                });
                io.to(SOCKET_ROOMS.role('manager')).emit(event, {
                    riderId: rider._id,
                    name: rider.name,
                    location: rider.currentLocation
                });
            }
        }
        catch (socketError) {
            logger.warn('Socket emission failed (non-critical):', socketError.message);
            // Continue anyway - this is not critical
        }

        if (isOnline) {
            riderAssignmentService.processWaitingOrders(req.app.get('io'));
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
        const rider = req.rider;
        res.json({
            success: true,
            data: {
                ...rider.toObject(),
                isApproved: rider.isApproved,
                isProfileComplete: rider.isProfileComplete
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed' });
    }
};
