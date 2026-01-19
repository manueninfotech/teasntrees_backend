import express from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../../controllers/customer/addressController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post('/', addAddress);
router.get('/', getAddresses);
router.put('/:addressId', updateAddress);
router.delete('/:addressId', deleteAddress);
router.put('/:addressId/default', setDefaultAddress);

export default router;
