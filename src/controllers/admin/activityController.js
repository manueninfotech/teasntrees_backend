import ActivityLog from '../../models/ActivityLog.js';

// Get all activity logs with filters
export const getAllActivityLogs = async (req, res) => {
    try {
        const { admin, action, resource, startDate, endDate, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;

        let query = {
            brand: req.activeBrand // ENFORCE BRAND SCOPE
        };

        // Filters
        if (admin) query.admin = admin;
        if (action) query.action = action;
        if (resource) query.resource = resource;

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(query)
            .populate('admin', 'name email mobile role')
            .sort({ [sortBy]: order })
            .limit(limit)
            .skip(skip);

        const total = await ActivityLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit,
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activity logs',
            error: error.message
        });
    }
};

// Get activity log by ID
export const getActivityLogById = async (req, res) => {
    try {
        const log = await ActivityLog.findById(req.params.id)
            .populate('admin', 'name email mobile role');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Activity log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: log
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activity log',
            error: error.message
        });
    }
};

// Get logs by specific admin
export const getLogsByAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const logs = await ActivityLog.find({ admin: req.params.adminId, brand: req.activeBrand })
            .populate('admin', 'name email mobile role')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await ActivityLog.countDocuments({ admin: req.params.adminId, brand: req.activeBrand });

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching admin logs',
            error: error.message
        });
    }
};

// Export logs (returns JSON for given date range)
export const exportLogs = async (req, res) => {
    try {
        const { startDate, endDate, admin, action, resource } = req.query;

        let query = {
            brand: req.activeBrand // ENFORCE BRAND SCOPE
        };

        if (admin) query.admin = admin;
        if (action) query.action = action;
        if (resource) query.resource = resource;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(query)
            .populate('admin', 'name email mobile role')
            .sort({ createdAt: -1 })
            .limit(10000); // Max 10k records for export

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
            exportDate: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error exporting logs',
            error: error.message
        });
    }
};

// Get activity statistics
export const getActivityStats = async (req, res) => {
    try {
        const totalLogs = await ActivityLog.countDocuments({ brand: req.activeBrand });

        // Actions breakdown
        const actionStats = await ActivityLog.aggregate([
            { $match: { brand: req.activeBrand } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Resource breakdown
        const resourceStats = await ActivityLog.aggregate([
            { $match: { brand: req.activeBrand } },
            { $group: { _id: '$resource', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Today's activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogs = await ActivityLog.countDocuments({
            brand: req.activeBrand,
            createdAt: { $gte: today }
        });

        // Most active admins
        const topAdmins = await ActivityLog.aggregate([
            { $match: { brand: req.activeBrand } },
            { $group: { _id: '$admin', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'adminInfo'
                }
            },
            { $unwind: '$adminInfo' },
            {
                $project: {
                    admin: {
                        _id: '$adminInfo._id',
                        name: '$adminInfo.name',
                        email: '$adminInfo.email',
                        role: '$adminInfo.role'
                    },
                    activityCount: '$count'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalLogs,
                todayLogs,
                actionBreakdown: actionStats,
                resourceBreakdown: resourceStats,
                topAdmins
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activity statistics',
            error: error.message
        });
    }
};
