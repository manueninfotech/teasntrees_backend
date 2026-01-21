import Delivery from '../../models/Delivery.js';
import logger from '../../config/logger.js';

// Get payout summary (Amount owed to each rider)
export const getPayoutStats = async (req, res) => {
    try {
        const stats = await Delivery.aggregate([
            {
                $match: {
                    status: 'delivered',
                    isPaid: false
                }
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
        const { riderId } = req.body;

        if (!riderId) {
            return res.status(400).json({ success: false, message: 'Rider ID is required' });
        }

        const result = await Delivery.updateMany(
            {
                riderId: riderId,
                status: 'delivered',
                isPaid: false
            },
            {
                $set: {
                    isPaid: true,
                    paidAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'No unpaid deliveries found for this rider' });
        }

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
