import User from '../../models/User.js';

// Get all users with filters
export const getAllUsers = async (req, res) => {
    try {
        const { role, search, isProfileComplete } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'desc' ? -1 : 1;
        const skip = (page - 1) * limit;
        let query = {};
        if (role) {
            query.role = role;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        if (isProfileComplete) {
            query.isProfileComplete = isProfileComplete === 'true';
        }
        const users = await User.find(query)
            .select('-__v')
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip(skip);
        const total = await User.countDocuments(query);
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Get single user by id
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-__v');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            data: user
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
        const validRoles = ['customer', 'rider', 'admin', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role value'
            });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        user.role = role;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
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
            .select('-__v')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users by role',
            error: error.message
        });
    }
};

// Delete or deactivate user
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // dont allow deleting own account
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }
        await user.deleteOne();
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const totalUsers = await user.countDocuments();
        const customers = await user.countDocuments({ role: 'customer' });
        const riders = await user.countDocuments({ role: 'rider' });
        const admins = await user.countDocuments({ role: 'admin' });
        const managers = await user.countDocuments({ role: 'manager' });
        // users registered today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const usersToday = await user.countDocuments({
            createdAt: {
                $gte: today
            }
        });
        // users with complete profiles
        const completeProfiles = await user.countDocuments({ isProfileComplete: true });
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
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};