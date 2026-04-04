// Customer Category Routes
// Endpoint: /api/customer/categories

import express from 'express';
import {
    getAllCategories,
    getCategoryById
} from '../../controllers/customer/categoryController.js';
import { optionalAuthenticate } from '../../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// Public routes - optionally use authentication to fetch brand preference
router.get('/', optionalAuthenticate, getAllCategories);
router.get('/:id', getCategoryById);

export default router;
