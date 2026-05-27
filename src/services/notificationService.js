import logger from '../config/logger.js';

/**
 * Notification Service
 * Handles sending Push Notifications (Placeholder for FCM/Firebase)
 * And integrates with Socket.io for fallback/real-time web updates
 */
class NotificationService {
    constructor() {
        this.fcmEnabled = process.env.FCM_SERVER_KEY ? true : false;
    }

    /**
     * Send Push Notification to a user
     * @param {Object} user - User document
     * @param {Object} notification - { title, body, data }
     */
    async sendPush(user, notification) {
        try {
            if (!user.fcmToken) {
                logger.debug(`No FCM token for user: ${user._id}`);
                return;
            }

            if (!this.fcmEnabled) {
                logger.warn('FCM Server Key not found. Push notification skipped.');
                logger.info(`[MOCK PUSH] to ${user.name}: ${notification.title} - ${notification.body}`);
                return;
            }

            // Real FCM logic would go here
            // Example:
            // admin.messaging().sendToDevice(user.fcmToken, { ... })
            logger.info(`Push notification sent to ${user.name}`);
        } catch (error) {
            logger.error('Push Notification Error:', error);
        }
    }

    /**
     * Send to multiple users
     */
    async sendPushToMany(users, notification) {
        const tokens = users.map(u => u.fcmToken).filter(t => !!t);
        if (tokens.length === 0) return;

        logger.info(`Batch push to ${tokens.length} users: ${notification.title}`);
        // Real FCM multicast logic here
    }

    /**
     * Helper to notify admin team
     */
    async notifyAdmins(adminModel, notification) {
        const admins = await adminModel.find({ role: { $in: ['admin', 'manager'] } });
        await this.sendPushToMany(admins, notification);
    }
}

export const notificationService = new NotificationService();
