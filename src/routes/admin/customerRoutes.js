import express from 'express';
import {
    getAllCustomers,
    getCustomerStats,
    getCustomerById,
    getCustomerOrders,
    toggleCustomerStatus,
    deleteCustomer
} from '../../controllers/admin/customerController.js';

const router = express.Router();

// Get customer stats
router.get('/stats', getCustomerStats);

// Get all customers
router.get('/', getAllCustomers);

// Get single customer by ID
router.get('/:id', getCustomerById);

// Get customer order history
router.get('/:id/orders', getCustomerOrders);

// Toggle customer status (activate/deactivate)
router.put('/:id/status', toggleCustomerStatus);

// Delete customer
router.delete('/:id', deleteCustomer);

export default router;
