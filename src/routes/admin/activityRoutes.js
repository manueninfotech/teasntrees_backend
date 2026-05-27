import express from 'express';
import {
    getAllActivityLogs,
    getActivityLogById,
    getLogsByAdmin,
    exportLogs,
    getActivityStats
} from '../../controllers/admin/activityController.js';

const router = express.Router({ mergeParams: true });

// Get all activity logs (with filters)
router.get('/', getAllActivityLogs);

// Get activity statistics (specific path before parameterized routes)
router.get('/stats', getActivityStats);

// Export logs (specific path before parameterized routes)
router.get('/export', exportLogs);

// Get logs by specific admin (parameterized route)
router.get('/admin/:adminId', getLogsByAdmin);

// Get single activity log by ID (catch-all at the end)
router.get('/:id', getActivityLogById);

export default router;
