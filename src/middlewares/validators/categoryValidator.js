import { body, param, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Category validation rules
export const validateCreateCategory = [
    body('name')
        .trim()
        .notEmpty().withMessage('Category name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2-50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Description must not exceed 200 characters'),

    body('icon')
        .optional()
        .trim(),

    body('displayOrder')
        .optional()
        .isInt({ min: 0 }).withMessage('Display order must be a positive number'),

    handleValidationErrors
];

export const validateUpdateCategory = [
    param('id')
        .isMongoId().withMessage('Invalid category ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2-50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Description must not exceed 200 characters'),

    body('icon')
        .optional()
        .trim(),

    body('displayOrder')
        .optional()
        .isInt({ min: 0 }).withMessage('Display order must be a positive number'),

    handleValidationErrors
];

export const validateCategoryId = [
    param('id')
        .isMongoId().withMessage('Invalid category ID'),

    handleValidationErrors
];
