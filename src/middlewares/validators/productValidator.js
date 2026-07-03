import { body, param } from 'express-validator';
import { handleValidationErrors } from './categoryValidator.js';

// Product validation rules
export const validateCreateProduct = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2-100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isMongoId().withMessage('Invalid category ID'),

    body('price')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('cakePricing')
        .optional({ nullable: true })
        .isObject().withMessage('cakePricing must be an object'),

    body('cakePricing.basePricePerKg')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('basePricePerKg must be a positive number'),

    body('cakePricing.customizationAvailable')
        .optional()
        .isBoolean().withMessage('customizationAvailable must be a boolean'),

    body('cakePricing.customizationPricePerKg')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('customizationPricePerKg must be a positive number'),

    body('cakePricing.egglessAvailable')
        .optional()
        .isBoolean().withMessage('egglessAvailable must be a boolean'),

    body('cakePricing.egglessExtraCharge')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('egglessExtraCharge must be a positive number'),

    body('image')
        .optional()
        .trim()
        .isURL({ require_tld: false }).withMessage('Image must be a valid URL'),

    body('isAvailable')
        .optional()
        .isBoolean().withMessage('isAvailable must be a boolean'),

    body('preparationTime')
        .optional()
        .isInt({ min: 0 }).withMessage('Preparation time must be a positive number'),

    body('ingredients')
        .optional()
        .isArray().withMessage('Ingredients must be an array'),

    body('allergens')
        .optional()
        .isArray().withMessage('Allergens must be an array'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array')
        .custom((tags) => {
            const validTags = ['new-intro', 'must-try', 'best-seller', 'egg-contains'];
            return tags.every(tag => validTags.includes(tag));
        }).withMessage('Tags must be one of: new-intro, must-try, best-seller, egg-contains'),

    body('sizeOptions')
        .optional()
        .isArray().withMessage('Size options must be an array'),

    body('sizeOptions.*.size')
        .optional()
        .trim()
        .notEmpty().withMessage('Size is required in size options'),

    body('sizeOptions.*.price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Size option price must be a positive number'),

    body('isSeasonal')
        .optional()
        .isBoolean().withMessage('isSeasonal must be a boolean'),

    body('availableMonths')
        .optional()
        .isArray().withMessage('availableMonths must be an array')
        .custom((months) => {
            if (!Array.isArray(months)) return false;
            return months.every(m => Number.isInteger(m) && m >= 1 && m <= 12);
        }).withMessage('availableMonths must contain integers between 1 and 12'),

    handleValidationErrors
];

export const validateUpdateProduct = [
    param('id')
        .isMongoId().withMessage('Invalid product ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2-100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),

    body('category')
        .optional()
        .isMongoId().withMessage('Invalid category ID'),

    body('price')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('cakePricing')
        .optional({ nullable: true })
        .isObject().withMessage('cakePricing must be an object'),

    body('cakePricing.basePricePerKg')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('basePricePerKg must be a positive number'),

    body('cakePricing.customizationAvailable')
        .optional()
        .isBoolean().withMessage('customizationAvailable must be a boolean'),

    body('cakePricing.customizationPricePerKg')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('customizationPricePerKg must be a positive number'),

    body('cakePricing.egglessAvailable')
        .optional()
        .isBoolean().withMessage('egglessAvailable must be a boolean'),

    body('cakePricing.egglessExtraCharge')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('egglessExtraCharge must be a positive number'),

    body('image')
        .optional()
        .trim()
        .isURL({ require_tld: false }).withMessage('Image must be a valid URL'),

    body('isAvailable')
        .optional()
        .isBoolean().withMessage('isAvailable must be a boolean'),

    body('preparationTime')
        .optional()
        .isInt({ min: 0 }).withMessage('Preparation time must be a positive number'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array')
        .custom((tags) => {
            const validTags = ['new-intro', 'must-try', 'best-seller', 'egg-contains'];
            return tags.every(tag => validTags.includes(tag));
        }).withMessage('Tags must be one of: new-intro, must-try, best-seller, egg-contains'),

    body('isSeasonal')
        .optional()
        .isBoolean().withMessage('isSeasonal must be a boolean'),

    body('availableMonths')
        .optional()
        .isArray().withMessage('availableMonths must be an array')
        .custom((months) => {
            if (!Array.isArray(months)) return false;
            return months.every(m => Number.isInteger(m) && m >= 1 && m <= 12);
        }).withMessage('availableMonths must contain integers between 1 and 12'),

    handleValidationErrors
];

export const validateProductId = [
    param('id')
        .isMongoId().withMessage('Invalid product ID'),

    handleValidationErrors
];

export const validateBulkUpdate = [
    body('productIds')
        .isArray({ min: 1 }).withMessage('Product IDs array is required')
        .custom((productIds) => {
            // Check if all elements are valid MongoDB ObjectIDs (24 hex characters)
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            const allValid = productIds.every(id => typeof id === 'string' && objectIdRegex.test(id));
            if (!allValid) {
                throw new Error('All product IDs must be valid MongoDB ObjectIDs');
            }
            return true;
        }),

    body('updates')
        .notEmpty().withMessage('Updates object is required')
        .isObject().withMessage('Updates must be an object'),

    handleValidationErrors
];
