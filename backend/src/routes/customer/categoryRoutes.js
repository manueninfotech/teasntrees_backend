// Customer Category Routes
// Endpoint: /api/customer/categories

import express from 'express';
import {
    getAllCategories,
    getCategoryById
} from '../../controllers/customer/categoryController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

export default router;
