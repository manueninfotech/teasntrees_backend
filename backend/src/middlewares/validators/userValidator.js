import { body, param } from 'express-validator';
import { handleValidationErrors } from './categoryValidator.js';

// User validation rules
export const validateUpdateUserRole = [
    param('id')
        .isMongoId().withMessage('Invalid user ID'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'customer', 'rider', 'manager'])
        .withMessage('Invalid role. Must be one of: admin, customer, rider, manager'),

    handleValidationErrors
];

export const validateUserId = [
    param('id')
        .isMongoId().withMessage('Invalid user ID'),

    handleValidationErrors
];
