// Customer Product Routes
// Endpoint: /api/customer/products

import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductsByCategory
} from '../../controllers/customer/productController.js';
import { optionalAuthenticate } from '../../middlewares/auth.js';

const router = express.Router();

// Public routes - optionally use authentication to fetch brand preference
router.get('/', optionalAuthenticate, getAllProducts);
router.get('/category/:categoryId', optionalAuthenticate, getProductsByCategory);
router.get('/:id', getProductById);

export default router;
