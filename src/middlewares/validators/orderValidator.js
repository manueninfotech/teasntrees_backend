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

    body()
        .custom((value) => {
            // Either riderId or auto must be provided
            if (!value.riderId && !value.auto) {
                throw new Error('Either riderId or auto: true is required');
            }
            // If riderId is provided, it must be a valid MongoDB ID
            if (value.riderId && !value.riderId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('Invalid rider ID format');
            }
            return true;
        }),

    handleValidationErrors
];

export const validateOrderId = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    handleValidationErrors
];
