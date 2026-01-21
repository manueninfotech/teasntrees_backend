import Rider from '../../models/Rider.js';
import logger from '../../config/logger.js';

// Get all riders (with filters)
export const getAllRiders = async (req, res) => {
    try {
        const { isApproved, isActive, page = 1, limit = 10 } = req.query;

        const query = {};
        if (isApproved !== undefined) {
            query.isApproved = isApproved === 'true';
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const riders = await Rider.find(query)
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalRiders = await Rider.countDocuments(query);

        res.json({
            success: true,
            data: {
                riders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRiders / limit),
                    totalRiders,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get All Riders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch riders',
            error: error.message
        });
    }
};

// Get pending riders (waiting for approval)
export const getPendingRiders = async (req, res) => {
    try {
        const riders = await Rider.find({ isApproved: false })
            .select('-__v')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: riders,
            count: riders.length
        });
    } catch (error) {
        logger.error('Get Pending Riders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending riders',
            error: error.message
        });
    }
};

// Get rider by ID
export const getRiderById = async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id).select('-__v');

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        res.json({
            success: true,
            data: rider
        });
    } catch (error) {
        logger.error('Get Rider By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rider',
            error: error.message
        });
    }
};

// Approve rider
export const approveRider = async (req, res) => {
    try {
        const { id } = req.params;

        const rider = await Rider.findById(id);
        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        if (rider.isApproved) {
            return res.status(400).json({
                success: false,
                message: 'Rider is already approved'
            });
        }

        rider.isApproved = true;
        await rider.save();

        res.json({
            success: true,
            message: 'Rider approved successfully',
            data: rider
        });
    } catch (error) {
        logger.error('Approve Rider Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve rider',
            error: error.message
        });
    }
};

// Reject/Revoke rider approval
export const rejectRider = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const rider = await Rider.findById(id);
        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        rider.isApproved = false;
        rider.rejectionReason = reason || 'Not specified';
        await rider.save();

        res.json({
            success: true,
            message: 'Rider approval revoked',
            data: rider
        });
    } catch (error) {
        logger.error('Reject Rider Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject rider',
            error: error.message
        });
    }
};

// Toggle rider active status
export const toggleRiderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const rider = await Rider.findById(id);
        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        rider.isActive = isActive;
        await rider.save();

        res.json({
            success: true,
            message: `Rider ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: rider
        });
    } catch (error) {
        logger.error('Toggle Rider Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rider status',
            error: error.message
        });
    }
};

// Delete rider
export const deleteRider = async (req, res) => {
    try {
        const { id } = req.params;

        const rider = await Rider.findByIdAndDelete(id);
        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        res.json({
            success: true,
            message: 'Rider deleted successfully'
        });
    } catch (error) {
        logger.error('Delete Rider Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete rider',
            error: error.message
        });
    }
};
