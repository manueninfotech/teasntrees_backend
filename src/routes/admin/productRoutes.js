import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    bulkUpdateProducts
} from '../../controllers/admin/productController.js';
import {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductId,
    validateBulkUpdate
} from '../../middlewares/validators/productValidator.js';
import upload from '../../middlewares/upload.js';

const router = express.Router();

// Get all products
router.get('/', getAllProducts);

// Get single product by id
router.get('/:id', validateProductId, getProductById);

// Get products by category
router.get('/category/:categoryId', getProductsByCategory);

// Create new product (with optional image upload)
router.post('/', upload.single('image'), validateCreateProduct, createProduct);

// update product (with optional image upload)
router.put('/:id', upload.single('image'), validateUpdateProduct, updateProduct);

// delete product
router.delete('/:id', validateProductId, deleteProduct);

// toggle product availability
router.put('/:id/availability', validateProductId, toggleProductAvailability);

// bulk update products
router.put('/bulk-update', validateBulkUpdate, bulkUpdateProducts);

export default router;
