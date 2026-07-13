import express from 'express';
import {
    getAllManagers,
    getPendingManagers,
    approveManager,
    rejectManager,
    toggleManagerStatus,
    deleteManager
} from '../../controllers/admin/managerController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getAllManagers);
router.get('/pending', getPendingManagers);
router.put('/:id/approve', approveManager);
router.put('/:id/reject', rejectManager);
router.put('/:id/status', toggleManagerStatus);
router.delete('/:id', deleteManager);

export default router;
