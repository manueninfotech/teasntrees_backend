import mongoose from 'mongoose';
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
        if (brand) {
            // Same landmine as processPayout had: this loaded the _id of every
            // order in the brand and passed them all as an `$in`. Delivery has
            // its own `brand` (verified populated on every existing row), so
            // filter on that and let the index do the work.
            match.brand = brand;
        }

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
        if (brand) {
            // Delivery carries its own `brand`. This used to load the _id of
            // EVERY order in the brand and pass them all as an `$in` — fine with
            // a hundred orders, a several-megabyte query with a hundred
            // thousand, and it grows forever.
            filter.brand = brand;
        }

        // What are we about to pay? Read it BEFORE the update flips isPaid, or
        // the deliveries no longer match the filter and the sum comes back zero.
        //
        // Nothing recorded the payout AMOUNT anywhere: the deliveries got an
        // isPaid flag and a reference, the activity log noted a COUNT, and the
        // rider was told "N deliveries". So there was no financial record of how
        // much money left the business — reconciliation was impossible from the
        // app's own data.
        const [totals] = await Delivery.aggregate([
            { $match: { ...filter, riderId: new mongoose.Types.ObjectId(String(riderId)) } },
            { $group: { _id: null, amount: { $sum: '$totalEarning' }, count: { $sum: 1 } } }
        ]);
        const payoutAmount = Math.round((totals?.amount || 0) * 100) / 100;

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
                    // Was: `Your payout of ₹${result.modifiedCount} deliveries` —
                    // a rupee sign in front of a COUNT, so a rider paid ₹2,000
                    // across 5 jobs was told "₹5". Tell them the money.
                    socketService.notifyUser(riderId, 'payout:processed', {
                        message: `₹${payoutAmount} for ${result.modifiedCount} deliveries has been paid out.`,
                        amount: payoutAmount,
                        count: result.modifiedCount
                    });
                }

                // Push Notification
                const { notificationService } = await import('../../services/notificationService.js');
                await notificationService.sendPush(rider, {
                    title: 'Payout processed',
                    body: `₹${payoutAmount} for ${result.modifiedCount} deliveries has been transferred to your bank account.`,
                    data: {
                        type: 'payout',
                        amount: String(payoutAmount),
                        count: String(result.modifiedCount)
                    }
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
                deliveriesUpdated: result.modifiedCount,
                // The only durable record of how much was actually paid.
                amount: payoutAmount,
                payoutReference: payoutReference || null
            }
        });

        res.json({
            success: true,
            message: `Paid ₹${payoutAmount} across ${result.modifiedCount} deliveries`,
            data: {
                amount: payoutAmount,
                deliveriesUpdated: result.modifiedCount
            }
        });

    } catch (error) {
        logger.error('Process Payout Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process payout' });
    }
};
