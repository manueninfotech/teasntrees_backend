import express from 'express';
import {
    registerRider,
    toggleAvailability,
    getProfile,
    completeProfile,
    firebaseLogin
} from '../../controllers/rider/authController.js';
import { riderAuth, isApprovedRider } from '../../middlewares/riderAuth.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router({ mergeParams: true });

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'rider-docs',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    },
});

const upload = multer({ storage: storage });

// Define Upload Fields
const riderUploads = upload.fields([
    { name: 'licensePhoto', maxCount: 1 },
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
]);

// Public Routes
router.post('/register', riderUploads, registerRider);
router.post('/firebase-login', firebaseLogin);

// Protected Routes
router.post('/availability', riderAuth, isApprovedRider, toggleAvailability);
router.get('/profile', riderAuth, getProfile);
router.post('/complete-profile', riderAuth, riderUploads, completeProfile);

export default router;
