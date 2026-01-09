import express from 'express';
import {
    getSettings,
    updateSettings,
    getDeliveryZones,
    updateDeliveryZones
} from '../../controllers/admin/settingsController.js';

const router = express.Router();

// Get delivery zones
router.get('/delivery-zones', getDeliveryZones);

// update delivery zones
router.put('/delivery-zones', updateDeliveryZones);

// Get application settings
router.get('/', getSettings);

// Update application settings
router.put('/', updateSettings);

export default router;