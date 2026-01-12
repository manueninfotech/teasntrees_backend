import express from 'express';
import {
    getAllActivityLogs,
    getActivityLogById,
    getLogsByAdmin,
    exportLogs,
    getActivityStats
} from '../../controllers/admin/activityController.js';

const router = express.Router();

// Get activity statistics
router.get('/stats', getActivityStats);

// Export logs
router.get('/export', exportLogs);

// Get all activity logs (with filters)
router.get('/', getAllActivityLogs);

// Get logs by specific admin
router.get('/admin/:adminId', getLogsByAdmin);

// Get single activity log by ID
router.get('/:id', getActivityLogById);

export default router;
