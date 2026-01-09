import express from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../../controllers/admin/categoryController.js';

const router = express.Router();
// Get all categories
router.get('/', getAllCategories);

// Get single category by id
router.get('/:id', getCategoryById);

// Create new category
router.post('/', createCategory);

// update category
router.put('/:id', updateCategory);

// delete category
router.delete('/:id', deleteCategory);

export default router;