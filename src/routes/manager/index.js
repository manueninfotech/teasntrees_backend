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

import { brandGuard } from '../../middlewares/brandGuard.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkRole } from '../../middlewares/roleCheck.js';

const router = express.Router({ mergeParams: true });

// Apply brand guard to all manager routes
router.use(brandGuard);

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

// Upload routes (shared with admin controller but permitted for managers here).
//
// THESE WERE COMPLETELY UNAUTHENTICATED. Every other route here is protected
// inside its own sub-router; these two were mounted straight onto the manager
// index, which only applies `brandGuard`. So anyone on the internet could
// POST arbitrary images into our storage, and — verified against production —
// `DELETE /api/<brand>/manager/upload/image` answered
// `200 {"success":true,"message":"Image deleted successfully"}` with no token
// at all. Product photos, category art and brand logos were one unauthenticated
// request away from deletion.
//
// (The equivalent customer upload routes were locked down earlier; this pair was
// missed because it doesn't live in a sub-router with the others.)
const managerOnly = [authenticate, checkRole(['manager', 'admin'])];

router.post('/upload/image', ...managerOnly, upload.single('image'), uploadImage);
router.delete('/upload/image', ...managerOnly, deleteImage);

export default router;
