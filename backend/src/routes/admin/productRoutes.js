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

const router = express.Router();

// Get all products
router.get('/', getAllProducts);

// Get single product by id
router.get('/:id', getProductById);

// Get products by category
router.get('/category/:categoryId', getProductsByCategory);

// Create new product
router.post('/', createProduct);

// update product
router.put('/:id', updateProduct);

// delete product
router.delete('/:id', deleteProduct);

// toggle product availability
router.put('/:id/availability', toggleProductAvailability);

// bulk update products
router.put('/bulk-update', bulkUpdateProducts);

export default router;
