import express from 'express';
import {
    getAllRiders,
    getPendingRiders,
    getRiderById,
    approveRider,
    rejectRider,
    toggleRiderStatus,
    deleteRider
} from '../../controllers/admin/riderController.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router({ mergeParams: true });

// Get all riders
router.get('/', getAllRiders);

// Get pending riders (waiting for approval)
router.get('/pending', getPendingRiders);

// Get rider by ID
router.get('/:id', getRiderById);

// Approve rider
router.put('/:id/approve', approveRider);

// Reject/Revoke rider approval
router.put('/:id/reject', rejectRider);

// Toggle rider active status
router.put('/:id/status', toggleRiderStatus);

// Delete rider
router.delete('/:id', deleteRider);

export default router;
