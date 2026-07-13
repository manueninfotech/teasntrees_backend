import express from 'express';
import {
    getSettings,
    updateSettings,
    getDeliveryZones,
    updateDeliveryZones,
    getOutlets
} from '../../controllers/admin/settingsController.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router({ mergeParams: true });

// Get delivery zones
router.get('/delivery-zones', getDeliveryZones);

// Get outlets
router.get('/outlets', getOutlets);

// update delivery zones
router.put('/delivery-zones', logActivity('update', 'settings'), updateDeliveryZones);

// Get application settings
router.get('/', getSettings);

// Update application settings
router.put('/', logActivity('update', 'settings'), updateSettings);

export default router;
