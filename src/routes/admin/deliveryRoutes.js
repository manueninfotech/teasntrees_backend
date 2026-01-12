import express from 'express';
import {
    getAllDeliveries,
    getDeliveryById,
    updateDeliveryStatus,
    updateDeliveryLocation,
    completeDelivery,
    getDeliveryStats
} from '../../controllers/admin/deliveryController.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router();

// Get delivery stats
router.get('/stats', getDeliveryStats);

// Get deliveries with filters
router.get('/', getAllDeliveries);

// Get single delivery by id
router.get('/:id', getDeliveryById);

// Update delivery status
router.put('/:id/status', logActivity('update', 'delivery'), updateDeliveryStatus);

// Update delivery location
router.put('/:id/location', logActivity('update', 'delivery'), updateDeliveryLocation);

// Complete delivery
router.put('/:id/complete', logActivity('update', 'delivery'), completeDelivery);

export default router;