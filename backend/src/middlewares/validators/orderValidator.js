import { body, param } from 'express-validator';
import { handleValidationErrors } from './categoryValidator.js';

// Order validation rules
export const validateUpdateOrderStatus = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid order status'),

    handleValidationErrors
];

export const validateAssignRider = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    body('riderId')
        .notEmpty().withMessage('Rider ID is required')
        .isMongoId().withMessage('Invalid rider ID'),

    handleValidationErrors
];

export const validateOrderId = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    handleValidationErrors
];
