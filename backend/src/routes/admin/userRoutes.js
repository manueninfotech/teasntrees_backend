import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUserRole,
    getUsersByRole,
    deleteUser,
    getUserStats
} from '../../controllers/admin/userManagementController.js';

const router = express.Router();

// Get user stats
router.get('/stats', getUserStats);

// Get all users
router.get('/', getAllUsers);

// Get single user by id
router.get('/:id', getUserById);

// Update user role
router.put('/:id/role', updateUserRole);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Delete user
router.delete('/:id', deleteUser);

export default router;