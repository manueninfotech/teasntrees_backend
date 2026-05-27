import express from 'express';
import {
    getAllDeliveries,
    getDeliveryById,
    getDeliveryStats
} from '../../controllers/admin/deliveryController.js';

const router = express.Router({ mergeParams: true });

// Get delivery stats
router.get('/stats', getDeliveryStats);

// Get deliveries with filters
router.get('/', getAllDeliveries);

// Get single delivery by id
router.get('/:id', getDeliveryById);

export default router;
