import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import orderRoutes from './orderRoutes.js';
import productRoutes from './productRoutes.js';
import riderRoutes from './riderRoutes.js';
import customerRoutes from './customerRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import profileRoutes from './profileRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import { uploadImage, deleteImage } from '../../controllers/admin/uploadController.js';
import upload from '../../middlewares/upload.js';

const router = express.Router({ mergeParams: true });

// Auth routes (public + protected inside)
router.use('/auth', authRoutes);

// Protected routes (middleware applied in sub-routes)
router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/riders', riderRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/profile', profileRoutes);
router.use('/categories', categoryRoutes);

// Upload routes (shared with admin controller but permitted for managers here)
router.post('/upload/image', upload.single('image'), uploadImage);
router.delete('/upload/image', deleteImage);

export default router;
