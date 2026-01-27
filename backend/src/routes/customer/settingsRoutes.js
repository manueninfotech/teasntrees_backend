import express from 'express';
import { getPublicSettings } from '../../controllers/customer/settingsController.js';

const router = express.Router();

// Get public settings (no auth required)
router.get('/', getPublicSettings);

export default router;
