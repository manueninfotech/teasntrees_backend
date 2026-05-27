import DashboardStats from '../models/DashboardStats.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import logger from '../config/logger.js';

class StatsService {
    // Sync all stats from DB (Self-Healing)
    async syncStats() {
        try {
            logger.info('Starting Dashboard Stats Sync...');

            const totalOrders = await Order.countDocuments();
            const totalCustomers = await User.countDocuments({ role: 'customer' });
            const totalProducts = await Product.countDocuments();
            const totalRiders = await User.countDocuments({ role: 'rider' });
            const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
            const pendingOrders = await Order.countDocuments({ status: 'pending' });

            // Calculate total revenue
            const revenueResult = await Order.aggregate([
                { $match: { status: 'delivered', paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

            const stats = await DashboardStats.getStats();
            stats.totalOrders = totalOrders;
            stats.totalCustomers = totalCustomers;
            stats.totalProducts = totalProducts;
            stats.totalRiders = totalRiders;
            stats.activeRiders = activeRiders;
            stats.pendingOrders = pendingOrders;
            stats.totalRevenue = totalRevenue;
            stats.lastUpdated = new Date();

            await stats.save();
            logger.info('Dashboard Stats Synced Successfully');
            return stats;
        } catch (error) {
            logger.error('Stats Sync Failed:', error);
            throw error;
        }
    }

    async getStats(options = {}) {
        return await DashboardStats.getStats(options);
    }

    // Atomic Increment
    async increment(field, amount = 1) {
        try {
            const update = { $inc: { [field]: amount }, lastUpdated: new Date() };
            const stats = await DashboardStats.findOneAndUpdate({}, update, { new: true, upsert: true });
            return stats;
        } catch (error) {
            logger.error(`Failed to increment ${field}:`, error);
        }
    }

    // Bulk Atomic Increment
    async bulkIncrement(increments) {
        try {
            const update = { $inc: increments, lastUpdated: new Date() };
            const stats = await DashboardStats.findOneAndUpdate({}, update, { new: true, upsert: true });
            return stats;
        } catch (error) {
            logger.error(`Failed bulk increment:`, error);
        }
    }

    // Atomic Decrement
    async decrement(field, amount = 1) {
        try {
            // Ensure we don't go below 0
            const stats = await DashboardStats.getStats();
            if (stats[field] > 0) {
                const update = { $inc: { [field]: -amount }, lastUpdated: new Date() };
                return await DashboardStats.findOneAndUpdate({}, update, { new: true });
            }
            return stats;
        } catch (error) {
            logger.error(`Failed to decrement ${field}:`, error);
        }
    }
}

export const statsService = new StatsService();
