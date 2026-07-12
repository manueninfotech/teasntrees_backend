import express from 'express';
import { uploadImage, deleteImage, uploadMultipleImages } from '../../controllers/admin/uploadController.js';
import upload from '../../middlewares/upload.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// Reusing admin controllers for now as logic is identical (upload to Cloudinary)
// Routes mounted at /api/customer/upload

// These were wide open: anyone could POST images into our storage (and delete
// them). Uploading is only ever done by a signed-in customer (profile photo,
// review photos), so require a valid session for everything below.
router.use(authenticate);

// Upload single image
router.post('/image', upload.single('image'), uploadImage);

// Upload multiple images
router.post('/images', upload.array('images', 5), uploadMultipleImages);

// Delete image
router.delete('/image', deleteImage);

export default router;
