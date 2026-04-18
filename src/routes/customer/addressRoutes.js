import express from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    reverseGeocode
} from '../../controllers/customer/addressController.js';

const router = express.Router({ mergeParams: true });

// Public Route (accessible during profile completion)
router.get('/reverse-geocode', reverseGeocode);

// Apply authentication middleware to all other routes
router.use(authenticate);
router.post('/', addAddress);
router.get('/', getAddresses);
router.put('/:addressId', updateAddress);
router.delete('/:addressId', deleteAddress);
router.put('/:addressId/default', setDefaultAddress);

export default router;
