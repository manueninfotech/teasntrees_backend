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

const router = express.Router();

// Get all products
router.get('/', getAllProducts);

// Get single product by id
router.get('/:id', validateProductId, getProductById);

// Get products by category
router.get('/category/:categoryId', getProductsByCategory);

// Create new product (with optional image upload)
router.post('/', upload.single('image'), validateCreateProduct, logActivity('create', 'product'), createProduct);

// update product (with optional image upload)
router.put('/:id', upload.single('image'), validateUpdateProduct, logActivity('update', 'product'), updateProduct);

// delete product
router.delete('/:id', validateProductId, logActivity('delete', 'product'), deleteProduct);

// toggle product availability
router.put('/:id/availability', validateProductId, logActivity('update', 'product'), toggleProductAvailability);

// bulk update products
router.put('/bulk-update', validateBulkUpdate, logActivity('update', 'product'), bulkUpdateProducts);

// Seasonal product management
router.get('/seasonal/all', getSeasonalProducts);
router.get('/seasonal/out-of-season', getOutOfSeasonProducts);
router.put('/:id/season', validateProductId, logActivity('update', 'product'), updateProductSeason);

export default router;
