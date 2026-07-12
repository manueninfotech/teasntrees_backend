import express from 'express';
import {
    getAllDeliveries,
    getDeliveryById,
    getDeliveryStats,
    cancelDelivery,
    reassignDelivery
} from '../../controllers/admin/deliveryController.js';

const router = express.Router({ mergeParams: true });

// Get delivery stats
router.get('/stats', getDeliveryStats);

// Get deliveries with filters
router.get('/', getAllDeliveries);

// Get single delivery by id
router.get('/:id', getDeliveryById);

// Recovery for a stalled rider (see deliveryWatchdogService): take the delivery
// off them, free them, and re-pool the order to someone else.
router.post('/:id/reassign', reassignDelivery);

// cancelDelivery existed in the controller but was never routed — the admin had
// no way to call it.
router.post('/:id/cancel', cancelDelivery);

export default router;
