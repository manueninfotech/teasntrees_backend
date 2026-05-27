import { body, param } from 'express-validator';
import { handleValidationErrors } from './categoryValidator.js';

// Order validation rules
export const validateUpdateOrderStatus = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'confirmed', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out-for-delivery', 'in_transit', 'delivered', 'cancelled'])
        .withMessage('Invalid order status'),

    handleValidationErrors
];

export const validateAssignRider = [
    param('id')
        .isMongoId().withMessage('Invalid order ID'),

    body()
        .custom((value, { req }) => {
            const { riderId, auto } = req.body;

            // Either riderId or auto: true must be provided
            if (!riderId && auto !== true) {
                throw new Error('Either riderId or auto: true is required');
            }

            // If riderId is provided, it must be a valid MongoDB ID
            if (riderId && !riderId.match(/^[0-9a-fA-F]{24}$/)) {
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
