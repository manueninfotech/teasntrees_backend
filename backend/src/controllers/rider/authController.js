import Rider from '../../models/Rider.js';
import User from '../../models/User.js';
import { riderMetricsService } from "../../services/riderMetricsService.js";
import { SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import { v2 as cloudinary } from 'cloudinary';
import logger from '../../config/logger.js';
import { riderAssignmentService } from '../../services/riderAssignmentService.js';
import activityLogService from '../../services/activityLogService.js';
import { verifyFirebaseToken } from '../../services/firebaseAuth.js';
import { generateToken, generateRefreshToken } from '../../utils/jwtHelper.js';
import RefreshToken from '../../models/RefreshToken.js';

// Register a new Rider (Manual Onboarding)
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

        // Check for duplicate vehicle
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

// Complete Profile (Requires JWT)
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

        // --- Location Fallback ---
        const { geocodingService } = await import('../../services/geocodingService.js');

        let targetCoords = null;

        if (parsedLocation && parsedLocation.lng && parsedLocation.lat) {
            targetCoords = [parseFloat(parsedLocation.lng), parseFloat(parsedLocation.lat)];
        } else if (rider.address || address) {
            const searchAddress = address || rider.address;
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
        const { isOnline, location } = req.body;
        const rider = req.rider;

        if (!rider) {
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

        // Emit Socket Event
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
            logger.warn('Socket emission failed:', socketError.message);
        }

        if (isOnline) {
            riderAssignmentService.processWaitingOrders(req.app.get('io'));
        }

        res.json({
            success: true,
            message: `You are now ${isOnline ? 'Online' : 'Offline'}`,
            data: { isOnline: isOnline }
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
        res.json({ success: true, data: { ...rider.toObject(), isApproved: rider.isApproved, isProfileComplete: rider.isProfileComplete } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed' });
    }
};

// Firebase Login
export const firebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'ID token required' });

        const decoded = await verifyFirebaseToken(idToken);
        const mobile = decoded.phone_number.replace(/\D/g, '').slice(-10);

        let rider = await Rider.findOne({ mobile });
        let isNewUser = false;

        if (!rider) {
            isNewUser = true;
            rider = new Rider({
                mobile,
                role: 'rider',
                isApproved: false,
                isProfileComplete: false,
                vehicleType: 'bike',
                vehicleNumber: 'PENDING',
                licenseNumber: 'PENDING',
                licenseExpiryDate: new Date(),
                aadharNumber: 'PENDING'
            });
            await rider.save();
            logger.info('New rider registered via Firebase', { mobile, userId: rider._id });
        }

        const token = generateToken({ userId: rider._id, role: 'rider' });
        const refreshToken = generateRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await RefreshToken.create({
            token: refreshToken,
            user: rider._id,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Log Activity
        await activityLogService.log(req, {
            adminId: rider._id,
            action: 'firebase_login',
            resource: 'user',
            resourceId: rider._id,
            details: { mobile: rider.mobile, role: 'rider', isNewUser }
        });

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            refreshToken,
            rider: {
                id: rider._id,
                name: rider.name,
                mobile: rider.mobile,
                role: 'rider',
                isApproved: rider.isApproved,
                isOnline: rider.isOnline,
                isProfileComplete: rider.isProfileComplete || false
            },
            isNewUser
        });
    } catch (error) {
        logger.error('Firebase login error (Rider):', error);
        res.status(401).json({ success: false, message: error.message });
    }
};

// Rider Mobile & PIN Login (Bypasses Firebase for quick verification/testing/onboarding fallback)
export const loginRider = async (req, res) => {
    try {
        const { mobile, pin } = req.body;
        if (!mobile || !pin) {
            return res.status(400).json({ success: false, message: 'Mobile number and PIN are required' });
        }

        const rider = await Rider.findOne({ mobile });
        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider account not found' });
        }

        // Self-heal: If rider doesn't have a PIN, generate one now
        if (!rider.verificationPin) {
            rider.verificationPin = Math.floor(1000 + Math.random() * 9000).toString();
            await User.findByIdAndUpdate(rider._id, { verificationPin: rider.verificationPin });
        }

        if (rider.verificationPin !== pin.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid verification PIN' });
        }

        const token = generateToken({ userId: rider._id, role: 'rider' });
        const refreshToken = generateRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await RefreshToken.create({
            token: refreshToken,
            user: rider._id,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            refreshToken,
            rider: {
                id: rider._id,
                name: rider.name,
                mobile: rider.mobile,
                email: rider.email,
                role: 'rider',
                isApproved: rider.isApproved,
                isOnline: rider.isOnline,
                isProfileComplete: rider.isProfileComplete || false,
                verificationPin: rider.verificationPin,
                totalDeliveries: rider.totalDeliveries,
                totalEarnings: rider.totalEarnings,
                averageRating: rider.averageRating,
                vehicleType: rider.vehicleType,
                vehicleNumber: rider.vehicleNumber,
                vehicleModel: rider.vehicleModel,
                licenseNumber: rider.licenseNumber,
                licenseExpiryDate: rider.licenseExpiryDate,
                licensePhoto: rider.licensePhoto,
                aadharNumber: rider.aadharNumber,
                aadharPhoto: rider.aadharPhoto,
                emergencyContact: rider.emergencyContact,
                bankAccountNumber: rider.bankAccountNumber,
                ifscCode: rider.ifscCode,
                accountHolderName: rider.accountHolderName
            }
        });
    } catch (error) {
        logger.error('Rider login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};
