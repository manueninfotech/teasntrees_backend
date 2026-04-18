import express from 'express';
import { uploadImage, deleteImage, uploadMultipleImages } from '../../controllers/admin/uploadController.js';
import upload from '../../middlewares/upload.js';

const router = express.Router({ mergeParams: true });

// Upload single image
router.post('/image', upload.single('image'), uploadImage);

// Upload multiple images
router.post('/images', upload.array('images', 10), uploadMultipleImages);

// Delete image
router.delete('/image', deleteImage);

export default router;
