import Rider from '../../models/Rider.js';
import User from '../../models/User.js';
import { riderMetricsService } from "../../services/riderMetricsService.js";
import { SOCKET_ROOMS } from "../../sockets/socketEvents.js";
import { uploadService } from '../../services/storage/upload.service.js';
import logger from '../../config/logger.js';
import { riderAssignmentService } from '../../services/riderAssignmentService.js';
import activityLogService from '../../services/activityLogService.js';
import { verifyFirebaseToken } from '../../services/firebaseAuth.js';
import { generateToken, generateRefreshToken } from '../../utils/jwtHelper.js';
import RefreshToken from '../../models/RefreshToken.js';
import fs from 'fs';
import path from 'path';

// Register a new Rider (Manual Onboarding)
export const registerRider = async (req, res) => {
    try {
        const {
            name, mobile, email,
            vehicleType, vehicleNumber, vehicleModel,
            bankAccountNumber, ifscCode, accountHolderName,
            emergencyName, emergencyPhone, emergencyRelation,
            emergencyContactName, emergencyContactMobile, emergencyContactRelation
        } = req.body;

        // Check if user already exists
        const existingUser = await Rider.findOne({ mobile });
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

        // Helper to upload memory buffer to Azure
        const uploadDoc = async (fileArray) => {
            if (fileArray && fileArray.length > 0) {
                const result = await uploadService.uploadPrivateFile(fileArray[0].buffer, 'rider-docs', fileArray[0].mimetype);
                return result.url;
            }
            return null;
        };

        // Accept either file uploads OR URLs from request body
        const licensePhoto = await uploadDoc(files.licensePhoto) || req.body.licensePhoto;
        const aadharPhoto = await uploadDoc(files.aadharPhoto) || req.body.aadharPhoto;
        const panPhoto = await uploadDoc(files.panPhoto) || req.body.panPhoto;
        const profilePhoto = await uploadDoc(files.profilePhoto) || req.body.profilePhoto;

        // Create Rider
        const rider = new Rider({
            name,
            mobile,
            email,
            role: 'rider',
            isApproved: false, // Pending admin approval
            isActive: true,
            isProfileComplete: true,

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
                name: emergencyName || emergencyContactName,
                mobile: emergencyPhone || emergencyContactMobile,
                relation: emergencyRelation || emergencyContactRelation
            }
        });

        // Self-heal: Generate a PIN for the rider
        rider.verificationPin = Math.floor(1000 + Math.random() * 9000).toString();

        await rider.save();

        // Generate tokens for auto-login
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

        res.status(201).json({
            success: true,
            message: 'Rider registered successfully. Waiting for admin approval.',
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
                isProfileComplete: rider.isProfileComplete,
                verificationPin: rider.verificationPin,
                vehicleType: rider.vehicleType,
                vehicleNumber: rider.vehicleNumber,
                vehicleModel: rider.vehicleModel,
                bankAccountNumber: rider.bankAccountNumber,
                ifscCode: rider.ifscCode,
                accountHolderName: rider.accountHolderName
            }
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

// Update FCM Token
export const updateFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const riderId = req.user.userId;

        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'FCM token required' });
        }

        await Rider.findByIdAndUpdate(riderId, { $set: { fcmToken } });

        res.json({ success: true, message: 'FCM token updated' });
    } catch (error) {
        logger.error('Error updating Rider FCM token:', error);
        res.status(500).json({ success: false, message: 'Failed to update token' });
    }
};

// Get Profile
export const getProfile = async (req, res) => {
    try {
        const riderId = req.user.userId;

        // Ensure metrics are up to date before returning profile
        await riderMetricsService.updateMetrics(riderId);

        // Fetch fresh doc from DB (middleware might have stale one)
        const freshRider = await Rider.findById(riderId);

        res.json({ 
            success: true, 
            data: { 
                ...freshRider.toObject(), 
                id: freshRider._id, 
                isApproved: freshRider.isApproved, 
                isProfileComplete: freshRider.isProfileComplete 
            } 
        });
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

// Serve private documents (Authenticated Rider or Admin only)
export const getDocument = async (req, res) => {
    try {
        const { filename } = req.params;
        const folder = req.query.folder || 'temp';

        // Ensure path traversal is prevented
        const sanitizedFilename = path.basename(filename);
        const sanitizedFolder = path.basename(folder);

        // Ownership check: a rider may only fetch their own documents
        // (identity docs on their Rider record, or proofs of their own
        // deliveries). Without this, any authenticated rider could pull
        // another rider's Aadhaar/PAN/licence by filename.
        const rider = req.rider;
        const ownDocUrls = [rider?.licensePhoto, rider?.aadharPhoto, rider?.panPhoto, rider?.profilePhoto]
            .filter(Boolean);
        let isOwner = ownDocUrls.some(url => url.includes(sanitizedFilename));

        if (!isOwner && rider) {
            const Delivery = (await import('../../models/Delivery.js')).default;
            const proofOwner = await Delivery.exists({
                riderId: rider._id,
                deliveryProof: { $regex: sanitizedFilename, $options: 'i' }
            });
            isOwner = Boolean(proofOwner);
        }

        if (!isOwner) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const privateRoot = process.env.STORAGE_PRIVATE_PATH || path.join(process.cwd(), 'uploads', 'private');
        const absolutePath = path.join(privateRoot, sanitizedFolder, sanitizedFilename);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).send('File not found');
        }

        res.sendFile(absolutePath);
    } catch (error) {
        logger.error('Error serving document:', error);
        res.status(500).send('Internal Server Error');
    }
};
