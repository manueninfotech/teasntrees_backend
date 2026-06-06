import cron from 'node-cron';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { fcmService } from '../services/fcmService.js';
import logger from '../config/logger.js';

/**
 * Nudge Worker
 * Handles periodic jobs for user engagement.
 */


/**
 * Job Logic: Check and notify abandoned carts
 */
export const checkAbandonedCarts = async () => {
    try {
        logger.info('Nudge Worker: Running Abandoned Cart Check...');
        
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

        // Find carts with items that haven't been updated for > 2 hours
        // and haven't been notified since the last update
        const abandonedCarts = await Cart.find({
            'items.0': { $exists: true }, // At least one item
            updatedAt: { $lt: twoHoursAgo },
            $or: [
                { lastAbandonedNotificationSentAt: { $exists: false } },
                { lastAbandonedNotificationSentAt: null },
                { $expr: { $lt: ['$lastAbandonedNotificationSentAt', '$updatedAt'] } }
            ]
        }).populate('userId', 'fcmToken name');

        logger.info(`Nudge Worker: Found ${abandonedCarts.length} abandoned carts to notify.`);

        for (const cart of abandonedCarts) {
            if (!cart.userId || !cart.userId.fcmToken) continue;

            const firstItem = cart.items[0];
            const itemName = firstItem.name || 'Your favorite items';
            const count = cart.items.length;

            const title = "You left something behind! 🛒";
            const body = count > 1
                ? `You left ${itemName} and ${count - 1} other item(s) in your cart. Come back and finish your order!`
                : `Your ${itemName} is waiting for you! Come back and finish your order.`;

            const success = await fcmService.sendPush(cart.userId.fcmToken, title, body, {
                type: 'abandoned_cart',
                cartId: cart._id.toString()
            });

            if (success) {
                cart.lastAbandonedNotificationSentAt = new Date();
                await cart.save();
            }
        }
    } catch (error) {
        logger.error(`Nudge Worker: Abandoned Cart Check failed: ${error.message}`);
    }
};

/**
 * Job Logic: Check and notify user retention
 */
export const checkUserRetention = async () => {
    try {
        logger.info('Nudge Worker: Running User Retention Check...');
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Identify customers who haven't ordered in the last 7 days
        const customers = await User.find({ role: 'customer', isActive: true, fcmToken: { $ne: null } });

        for (const customer of customers) {
            // Find the latest order for this customer
            const lastOrder = await Order.findOne({ customerId: customer._id })
                .sort({ createdAt: -1 })
                .lean();

            // If they have an order but it's older than 7 days
            if (lastOrder && lastOrder.createdAt < sevenDaysAgo) {
                const firstItem = lastOrder.items[0];
                const itemName = firstItem ? firstItem.name : null;

                const title = "We miss you!";
                const body = itemName
                    ? `We hope you're enjoying your day. How about some ${itemName}? Your favorites are waiting!`
                    : `We miss you! Why not check out what's new today?`;

                await fcmService.sendPush(customer.fcmToken, title, body, {
                    type: 'retention_nudge'
                });
            }
        }
    } catch (error) {
        logger.error(`Nudge Worker: User Retention Check failed: ${error.message}`);
    }
};

/**
 * Initialize Nudge Worker schedules
 */
export const initNudgeWorker = () => {
    logger.info('Nudge Worker: Initializing background jobs...');

    // 1. Abandoned Cart Job - Every 1 hour
    cron.schedule('0 * * * *', checkAbandonedCarts);

    // 2. User Retention Job - Once Daily (10:00 AM)
    cron.schedule('0 10 * * *', checkUserRetention);

    logger.info('Nudge Worker: Background jobs scheduled successfully.');
};
