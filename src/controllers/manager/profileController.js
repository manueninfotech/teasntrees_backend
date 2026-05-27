import User from '../../models/User.js';
import activityLogService from '../../services/activityLogService.js';

export const getProfile = async (req, res) => {
    try {
        const manager = await User.findById(req.user.userId);
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        res.status(200).json({
            success: true,
            data: manager
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email, address } = req.body;

        const updatedManager = await User.findByIdAndUpdate(
            req.user.userId,
            { name, email, address },
            { new: true, runValidators: true }
        );

        if (!updatedManager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'user',
            resourceId: updatedManager._id,
            details: { name: updatedManager.name, role: 'manager' }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedManager
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};
