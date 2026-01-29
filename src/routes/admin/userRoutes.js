import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUserRole,
    getUsersByRole,
    deleteUser,
    getUserStats,
    activateUser,
    deactivateUser
} from '../../controllers/admin/userManagementController.js';
import {
    validateUpdateUserRole,
    validateUserId
} from '../../middlewares/validators/userValidator.js';
import { logActivity } from '../../middlewares/activityLogger.js';

const router = express.Router();

// Get user stats
router.get('/stats', getUserStats);

// Get all users
router.get('/', getAllUsers);

// Get single user by id
router.get('/:id', validateUserId, getUserById);

// Activate user
router.put('/:id/activate', validateUserId, activateUser);

// Deactivate user
router.put('/:id/deactivate', validateUserId, deactivateUser);

// Update user role
router.put('/:id/role', validateUpdateUserRole, updateUserRole);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Delete user
router.delete('/:id', validateUserId, deleteUser);

export default router;