import express from 'express';
import {
    getAllDeliveries,
    getDeliveryById,
    updateDeliveryStatus,
    updateDeliveryLocation,
    completeDelivery,
    getDeliveryStats
} from '../../controllers/admin/deliveryController.js';

const router = express.Router();

// Get delivery stats
router.get('/stats', getDeliveryStats);

// Get deliveries with filters
router.get('/', getAllDeliveries);

// Get single delivery by id
router.get('/:id', getDeliveryById);

// Update delivery status
router.put('/:id/status', updateDeliveryStatus);

// Update delivery location
router.put('/:id/location', updateDeliveryLocation);

// Complete delivery
router.put('/:id/complete', completeDelivery);

export default router;