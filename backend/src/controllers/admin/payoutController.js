import Delivery from '../../models/Delivery.js';
import User from '../../models/User.js';
import logger from '../../config/logger.js';
import activityLogService from '../../services/activityLogService.js';

// Get payout summary (Amount owed to each rider)
export const getPayoutStats = async (req, res) => {
    try {
        const brand = req.activeBrand;
        const match = {
            status: 'delivered',
            isPaid: false
        };
        if (brand) match.brand = brand;

        const stats = await Delivery.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: '$riderId',
                    totalAmount: { $sum: '$totalEarning' },
                    count: { $sum: 1 },
                    lastDeliveryDate: { $max: '$deliveredAt' }
                }
            },
            {
                $lookup: {
                    from: 'users', // Rider is a discriminator key in 'users' collection usually, but check User model
                    localField: '_id',
                    foreignField: '_id',
                    as: 'riderInfo'
                }
            },
            {
                $project: {
                    riderId: '$_id',
                    totalAmount: 1,
                    count: 1,
                    lastDeliveryDate: 1,
                    riderName: { $arrayElemAt: ['$riderInfo.name', 0] },
                    riderMobile: { $arrayElemAt: ['$riderInfo.mobile', 0] }
                }
            }
        ]);

        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error('Get Payout Stats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payout stats' });
    }
};

// Mark deliveries as paid for a rider
export const processPayout = async (req, res) => {
    try {
        const { riderId, payoutReference } = req.body;

        if (!riderId) {
            return res.status(400).json({ success: false, message: 'Rider ID is required' });
        }

        const brand = req.activeBrand;
        const filter = {
            riderId: riderId,
            status: 'delivered',
            isPaid: false
        };
        if (brand) filter.brand = brand;
        const result = await Delivery.updateMany(
            filter,
            {
                $set: {
                    isPaid: true,
                    paidAt: new Date(),
                    payoutReference: payoutReference || null
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'No unpaid deliveries found for this rider' });
        }

        // --- NEW: Notifications ---
        let riderName = 'Rider';
        try {
            const rider = await User.findById(riderId);
            if (rider) {
                riderName = rider.name;
                // Socket.io update
                const socketService = req.app.get('socketService');
                if (socketService) {
                    socketService.notifyUser(riderId, 'payout:processed', {
                        message: `Your payout of ₹${result.modifiedCount} deliveries has been processed.`,
                        count: result.modifiedCount
                    });
                }

                // Push Notification
                const { notificationService } = await import('../../services/notificationService.js');
                await notificationService.sendPush(rider, {
                    title: 'Payout Processed! ',
                    body: `Your earnings for ${result.modifiedCount} deliveries have been transferred. Check your bank account.`,
                    data: { type: 'payout', count: result.modifiedCount }
                });
            }
        } catch (notifError) {
            logger.error('Failed to send payout notification:', notifError);
        }

        // Log Activity
        await activityLogService.log(req, {
            action: 'process_payout',
            resource: 'payout',
            details: {
                riderId,
                riderName,
                deliveriesUpdated: result.modifiedCount
            }
        });

        res.json({
            success: true,
            message: `Successfully processed payout for ${result.modifiedCount} deliveries`,
            data: {
                deliveriesUpdated: result.modifiedCount
            }
        });

    } catch (error) {
        logger.error('Process Payout Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process payout' });
    }
};
