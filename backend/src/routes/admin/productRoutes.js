import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    bulkUpdateProducts,
    getProductStats,
    getSeasonalProducts,
    getOutOfSeasonProducts,
    updateProductSeason
} from '../../controllers/admin/productController.js';
import {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductId,
    validateBulkUpdate
} from '../../middlewares/validators/productValidator.js';
import { logActivity } from '../../middlewares/activityLogger.js';
import upload from '../../middlewares/upload.js';

const router = express.Router({ mergeParams: true });

// Get all products
router.get('/', getAllProducts);

// Get product stats
router.get('/stats', getProductStats);

// Seasonal product management (before /:id to avoid wildcard catch)
router.get('/seasonal/all', getSeasonalProducts);
router.get('/seasonal/out-of-season', getOutOfSeasonProducts);

// Get products by category
router.get('/category/:categoryId', getProductsByCategory);

// Create new product (with optional image upload)
router.post('/', upload.single('image'), validateCreateProduct, createProduct);

// Bulk update products (before /:id to avoid wildcard catch)
router.put('/bulk-update', validateBulkUpdate, bulkUpdateProducts);

// Get single product by id
router.get('/:id', validateProductId, getProductById);

// Update product (with optional image upload)
router.put('/:id', upload.single('image'), validateUpdateProduct, updateProduct);

// Delete product
router.delete('/:id', validateProductId, deleteProduct);

// Toggle product availability
router.put('/:id/availability', validateProductId, toggleProductAvailability);

// Update product season
router.put('/:id/season', validateProductId, updateProductSeason);

export default router;
