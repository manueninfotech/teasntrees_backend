// Manager Management Controller (Admin Side)
import Manager from '../../models/Manager.js';
import activityLogService from '../../services/activityLogService.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';

// Get all managers (with filters)
export const getAllManagers = async (req, res) => {
    try {
        const { isApproved, isActive, search, page = 1, limit = 10 } = req.query;
        let query = {}; // No need to filter by role: 'manager' as Manager model handles it

        if (isApproved === 'true') query.isApproved = true;
        if (isApproved === 'false') query.isApproved = false;

        if (isActive === 'true') query.isActive = true;
        if (isActive === 'false') query.isActive = false;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const managers = await Manager.find(query)
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Manager.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                managers,
                pagination: {
                    current: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching managers',
            error: error.message
        });
    }
};

// Get pending managers
export const getPendingManagers = async (req, res) => {
    try {
        // Find managers where isApproved is STRICTLY null (Pending)
        // Rejected managers (false) should not appear in pending list
        const managers = await Manager.find({
            isApproved: null
        })
            .select('-password -__v')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: managers,
            count: managers.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending managers',
            error: error.message
        });
    }
};

// Approve Manager
export const approveManager = async (req, res) => {
    try {
        const { id } = req.params;
        const manager = await Manager.findById(id);

        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        if (manager.isApproved) {
            return res.status(400).json({ success: false, message: 'Manager already approved' });
        }

        manager.isApproved = true;
        manager.isActive = true; // Ensure they are active upon approval
        await manager.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'approve',
            resource: 'user',
            resourceId: manager._id,
            details: { name: manager.name, role: 'manager' }
        });

        // Socket Notification
        const io = req.app.get('io');
        if (io) {
            // Notify the manager
            io.to(SOCKET_ROOMS.user(manager._id)).emit(SOCKET_EVENTS.USER_APPROVED, {
                message: 'Your manager account has been approved'
            });
            // Update admin lists
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.MANAGER_STATUS_UPDATED, {
                managerId: manager._id,
                status: 'approved'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Manager approved successfully',
            data: manager
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving manager',
            error: error.message
        });
    }
};

// Reject Manager
export const rejectManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const manager = await Manager.findById(id);

        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        // Following Rider pattern: set isApproved=false
        manager.isApproved = false;
        manager.isActive = false; // Disable login

        await manager.save();

        // Log Activity
        await activityLogService.log(req, {
            action: 'reject',
            resource: 'user',
            resourceId: manager._id,
            details: { name: manager.name, role: 'manager', reason }
        });

        // Socket Notification
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.user(manager._id)).emit(SOCKET_EVENTS.USER_REJECTED, {
                message: 'Your manager request has been rejected',
                reason
            });
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.MANAGER_STATUS_UPDATED, {
                managerId: manager._id,
                status: 'rejected'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Manager rejected successfully',
            data: manager
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting manager',
            error: error.message
        });
    }
};

// Toggle Manager Status (Active/Inactive)
export const toggleManagerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const manager = await Manager.findById(id);

        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        manager.isActive = isActive;
        await manager.save();

        await activityLogService.log(req, {
            action: isActive ? 'activate' : 'deactivate',
            resource: 'user',
            resourceId: manager._id,
            details: { name: manager.name, role: 'manager' }
        });

        res.status(200).json({
            success: true,
            message: `Manager ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: manager
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating manager status',
            error: error.message
        });
    }
};

// Delete Manager
export const deleteManager = async (req, res) => {
    try {
        const { id } = req.params;
        const manager = await Manager.findByIdAndDelete(id);

        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        await activityLogService.log(req, {
            action: 'delete',
            resource: 'user',
            resourceId: id,
            details: { name: manager.name, role: 'manager' }
        });

        res.status(200).json({
            success: true,
            message: 'Manager deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting manager',
            error: error.message
        });
    }
};
