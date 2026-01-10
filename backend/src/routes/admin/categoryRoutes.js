import express from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../../controllers/admin/categoryController.js';
import {
    validateCreateCategory,
    validateUpdateCategory,
    validateCategoryId
} from '../../middlewares/validators/categoryValidator.js';

const router = express.Router();
// Get all categories
router.get('/', getAllCategories);

// Get single category by id
router.get('/:id', validateCategoryId, getCategoryById);

// Create new category
router.post('/', validateCreateCategory, createCategory);

// update category
router.put('/:id', validateUpdateCategory, updateCategory);

// delete category
router.delete('/:id', validateCategoryId, deleteCategory);

export default router;