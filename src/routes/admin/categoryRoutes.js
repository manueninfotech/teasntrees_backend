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
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router({ mergeParams: true });
// Get all categories
router.get('/', getAllCategories);

// Get single category by id
router.get('/:id', validateCategoryId, getCategoryById);

// Create new category
router.post('/', validateCreateCategory, logActivity('create', 'category'), createCategory);

// update category
router.put('/:id', validateUpdateCategory, logActivity('update', 'category'), updateCategory);

// delete category
router.delete('/:id', validateCategoryId, logActivity('delete', 'category'), deleteCategory);

export default router;
