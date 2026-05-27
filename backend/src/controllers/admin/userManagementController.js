import User from '../../models/User.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../sockets/socketEvents.js';
import activityLogService from '../../services/activityLogService.js';

// Get all users with filters
export const getAllUsers = async (req, res) => {
    try {
        const { role, search, isProfileComplete } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;

        const query = {};

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        // Profile complete filter
        if (isProfileComplete !== undefined) {
            query.isProfileComplete = isProfileComplete === 'true';
        }

        // Fetch users + total count in parallel
        const [users, total] = await Promise.all([
            User.find(query)
                .select('_id name email mobile role isActive createdAt')
                .sort({ [sortBy]: order })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit,
                totalItems: total
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);

        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Get single user by id
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user first to check role
        const baseUser = await User.findById(id).select('-password -__v');

        if (!baseUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let userData = baseUser.toObject();

        // If user is a Customer, populate their wishlist and addresses
        if (baseUser.role === 'customer') {
            const customer = await User.findById(id)
                .select('-password -__v')
                .populate({
                    path: 'wishlist',
                    select: 'name price image isAvailable'
                });
            userData = customer.toObject();
        }
        // If user is a Rider, they might have specific fields (vehicle details, etc.)
        else if (baseUser.role === 'rider') {
            const rider = await User.findById(id).select('-password -__v');
            userData = rider.toObject();
            // In the future, we could populate rider-specific stats here
        }

        res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;

        const validRoles = ['customer', 'rider', 'admin', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role value'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If role is unchanged, just return
        if (user.role === role) {
            return res.status(200).json({
                success: true,
                message: 'Role is already set to ' + role,
                data: user
            });
        }

        // Important: Update role AND the discriminator key 'kind' to ensure
        // Mongoose uses the correct model for subsequent queries.
        user.role = role;

        // Map roles to discriminator keys
        const roleToKind = {
            'customer': 'Customer',
            'rider': 'Rider',
            'admin': 'User',
            'manager': 'User'
        };

        user.kind = roleToKind[role] || 'User';

        await user.save();

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            // Notify the user whose role changed
            io.to(SOCKET_ROOMS.user(user._id.toString())).emit(SOCKET_EVENTS.USER_ROLE_UPDATED, {
                userId: user._id,
                newRole: role
            });

            // Notify admin (Broadcast to role room)
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.USER_ROLE_UPDATED, {
                userId: user._id,
                name: user.name,
                mobile: user.mobile,
                newRole: role
            });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'update',
            resource: 'user',
            resourceId: user._id,
            details: {
                name: user.name,
                previousRole: user.role,
                newRole: role
            }
        });

        res.status(200).json({
            success: true,
            message: `User role updated to ${role} successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

// Get user by role
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const validRoles = ['customer', 'rider', 'admin', 'manager'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role value'
            });
        }

        const users = await User.find({ role })
            .select('_id name email mobile role isActive createdAt')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Error fetching users by role:', error);

        return res.status(500).json({
            success: false,
            message: 'Error fetching users by role',
            error: error.message
        });
    }
};

/**
 * Activate user account
 * 
 * RE-ENABLES a previously deactivated user account.
 * User will be able to login again.
 * 
 * Use this to:
 * - Restore accounts after temporary suspension
 * - Re-enable accounts after resolving issues
 * - Reverse accidental deactivation
 */
export const activateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isActive) {
            return res.status(200).json({
                success: true,
                message: 'User is already active',
                data: user
            });
        }

        user.isActive = true;
        await user.save();

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            // Notify the user
            io.to(SOCKET_ROOMS.user(user._id.toString())).emit(SOCKET_EVENTS.USER_ACTIVATED, {
                message: 'Your account has been activated'
            });

            // Notify admins
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.USER_ACTIVATED, {
                userId: user._id,
                name: user.name,
                mobile: user.mobile
            });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'activate',
            resource: 'user',
            resourceId: user._id,
            details: { name: user.name, role: user.role }
        });

        res.status(200).json({
            success: true,
            message: 'User activated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error activating user',
            error: error.message
        });
    }
};

/**
 * Deactivate user account (SOFT DELETE)
 * 
 * What it does:
 * - Sets isActive = false
 * - User CANNOT login (blocked by auth middleware)
 * - User data REMAINS in database
 * - All relationships (orders, deliveries) stay intact
 * - Can be REVERSED with activateUser()
 * 
 * DO NOT use deleteUser() unless legally required!
 */
export const deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating own account
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }

        if (!user.isActive) {
            return res.status(200).json({
                success: true,
                message: 'User is already inactive',
                data: user
            });
        }

        user.isActive = false;
        await user.save();

        // Emit Socket.io event DIRECTLY
        const io = req.app.get('io');
        if (io) {
            // Notify the user
            io.to(SOCKET_ROOMS.user(user._id.toString())).emit(SOCKET_EVENTS.USER_DEACTIVATED, {
                message: 'Your account has been deactivated'
            });

            // Notify admins
            io.to(SOCKET_ROOMS.role('admin')).emit(SOCKET_EVENTS.USER_DEACTIVATED, {
                userId: user._id,
                name: user.name,
                mobile: user.mobile
            });
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'deactivate',
            resource: 'user',
            resourceId: user._id,
            details: { name: user.name, role: user.role }
        });

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating user',
            error: error.message
        });
    }
};

/**
 * PERMANENTLY DELETE user (HARD DELETE)
 * 
 * What it does:
 * - PERMANENTLY removes user from database
 * - User data is GONE FOREVER (cannot be recovered)
 * - BREAKS relationships - orders/deliveries will have invalid user references
 * - NO AUDIT TRAIL - historical data becomes incomplete
 * - CANNOT BE UNDONE
 * 
 */
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent deleting own account
        if (userId === req.user.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Get minimal user data
        const user = await User.findById(userId)
            .select('_id name role')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user
        await User.deleteOne({ _id: userId });

        const userData = {
            id: user._id,
            name: user.name,
            role: user.role
        };

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit(SOCKET_EVENTS.USER_DELETED, userData);
        }

        // Log activity in background (non-blocking)
        activityLogService.log(req, {
            action: 'delete',
            resource: 'user',
            resourceId: userData.id,
            details: { name: userData.name, role: userData.role }
        }).catch(() => { });

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);

        return res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const customers = await User.countDocuments({ role: 'customer' });
        const riders = await User.countDocuments({ role: 'rider' });
        const admins = await User.countDocuments({ role: 'admin' });
        const managers = await User.countDocuments({ role: 'manager' });
        // users registered today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const usersToday = await User.countDocuments({
            createdAt: {
                $gte: today
            }
        });
        // users with complete profiles
        const completeProfiles = await User.countDocuments({ isProfileComplete: true });
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                customers,
                riders,
                admins,
                managers,
                usersToday,
                completeProfiles
            }
        });
    } catch (error) {
        console.error('GetUserStats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};