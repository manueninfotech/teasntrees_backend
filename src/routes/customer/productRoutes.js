// Customer Product Routes
// Endpoint: /api/customer/products

import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductsByCategory
} from '../../controllers/customer/productController.js';

const router = express.Router();

// Public routes - no authentication required for browsing
router.get('/', getAllProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

export default router;
