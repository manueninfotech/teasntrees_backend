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

// Auth routes first — logging in is necessarily public.
router.use('/auth', authRoutes);

// BRAND ISOLATION WAS SILENTLY OFF.
//
// `brandGuard` compares req.user.brand against the brand in the URL and 403s on
// a mismatch. But it was mounted HERE, at the top of the index, while
// `authenticate` runs down inside each sub-router — so at guard time `req.user`
// was still undefined, the guard hit its `if (!req.user) return next()` and
// waved everything through. It has never blocked a single request.
//
// The controllers serve data by `req.activeBrand`, which comes from the URL. So
// a Little H manager holding a perfectly legitimate token could simply call
// /api/teasntrees/manager/orders and read — and modify — the other brand's
// orders, products, categories, customers and riders. (The login route does
// reject a cross-brand LOGIN, but that only guards logging in, not the token
// afterwards.)
//
// Authentication must therefore happen BEFORE the guard that depends on it.
// The sub-routers still apply their own authenticate/checkRole; that's
// redundant now, but harmless, and it keeps them safe if ever mounted elsewhere.
router.use(authenticate);
router.use(checkRole(['manager', 'admin']));
router.use(brandGuard);

// Protected routes
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
