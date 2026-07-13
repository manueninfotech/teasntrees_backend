import Rider from '../../models/Rider.js';
import Delivery from '../../models/Delivery.js';
import logger from '../../config/logger.js';
import mongoose from 'mongoose';
import { SOCKET_EVENTS } from '../../sockets/socketEvents.js';
import activityLogService from '../../services/activityLogService.js';

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
            .skip(skip)
            .lean(); // Use lean for performance and to allow manual decoration

        const riderIds = riders.map(r => r._id);

        // Calculate earnings for these riders
        const earningsStats = await Delivery.aggregate([
            {
                $match: {
                    riderId: { $in: riderIds },
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: '$riderId',
                    totalEarnings: { $sum: '$totalEarning' },
                    pendingEarnings: {
                        $sum: {
                            $cond: [{ $eq: ['$isPaid', false] }, '$totalEarning', 0]
                        }
                    }
                }
            }
        ]);

        // Map stats to riders
        const statsMap = earningsStats.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr;
            return acc;
        }, {});

        const decoratedRiders = await Promise.all(riders.map(async (r) => {
            const { riderAssignmentService } = await import('../../services/riderAssignmentService.js');
            const isOnDelivery = await riderAssignmentService.syncRiderStatus(r._id);
            return {
                ...r,
                totalEarnings: statsMap[r._id.toString()]?.totalEarnings || 0,
                pendingEarnings: statsMap[r._id.toString()]?.pendingEarnings || 0,
                isOnDelivery: isOnDelivery,
                isBusy: isOnDelivery
            };
        }));

        const totalRiders = await Rider.countDocuments(query);

        res.json({
            success: true,
            data: {
                riders: decoratedRiders,
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
        const rider = await Rider.findById(req.params.id).select('-__v').lean();

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        // Calculate earnings for this specific rider
        const earningsStats = await Delivery.aggregate([
            {
                $match: {
                    riderId: new mongoose.Types.ObjectId(req.params.id),
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: '$riderId',
                    totalEarnings: { $sum: '$totalEarning' },
                    pendingEarnings: {
                        $sum: {
                            $cond: [{ $eq: ['$isPaid', false] }, '$totalEarning', 0]
                        }
                    }
                }
            }
        ]);

        const stats = earningsStats[0] || { totalEarnings: 0, pendingEarnings: 0 };

        res.json({
            success: true,
            data: {
                ...rider,
                totalEarnings: stats.totalEarnings,
                pendingEarnings: stats.pendingEarnings
            }
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

        // Log Activity
        await activityLogService.log(req, {
            action: 'approve',
            resource: 'rider',
            resourceId: rider._id,
            details: { name: rider.name }
        });

        res.json({
            success: true,
            message: 'Rider approved successfully',
            data: rider
        });

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('admin', SOCKET_EVENTS.RIDER_STATUS_UPDATED, {
                riderId: rider._id,
                status: 'approved',
                name: rider.name
            });
            socketService.notifyRole('manager', SOCKET_EVENTS.RIDER_STATUS_UPDATED, {
                riderId: rider._id,
                status: 'approved',
                name: rider.name
            });
        }
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

        // Log Activity
        await activityLogService.log(req, {
            action: 'reject',
            resource: 'rider',
            resourceId: rider._id,
            details: { name: rider.name, reason: rider.rejectionReason }
        });

        res.json({
            success: true,
            message: 'Rider approval revoked',
            data: rider
        });

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('admin', SOCKET_EVENTS.RIDER_STATUS_UPDATED, {
                riderId: rider._id,
                status: 'rejected',
                name: rider.name,
                reason: rider.rejectionReason
            });
        }
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

        // Log Activity
        await activityLogService.log(req, {
            action: isActive ? 'activate' : 'deactivate',
            resource: 'rider',
            resourceId: rider._id,
            details: { name: rider.name }
        });

        res.json({
            success: true,
            message: `Rider ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: rider
        });

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('admin', SOCKET_EVENTS.RIDER_STATUS_UPDATED, {
                riderId: rider._id,
                isActive: rider.isActive,
                name: rider.name
            });
        }
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

        // Log Activity
        await activityLogService.log(req, {
            action: 'delete',
            resource: 'rider',
            resourceId: id,
            details: { name: rider.name }
        });

        res.json({
            success: true,
            message: 'Rider deleted successfully'
        });

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.notifyRole('admin', SOCKET_EVENTS.RIDER_STATUS_UPDATED, {
                riderId: id,
                status: 'deleted'
            });
        }
    } catch (error) {
        logger.error('Delete Rider Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete rider',
            error: error.message
        });
    }
};
