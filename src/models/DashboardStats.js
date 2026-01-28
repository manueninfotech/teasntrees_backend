import mongoose from 'mongoose';

const dashboardStatsSchema = new mongoose.Schema({
    totalOrders: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalRiders: { type: Number, default: 0 },
    activeRiders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Singleton pattern: ensure only one stats document exists
dashboardStatsSchema.statics.getStats = async function () {
    let stats = await this.findOne();
    if (!stats) {
        stats = await this.create({});
    }
    return stats;
};

const DashboardStats = mongoose.model('DashboardStats', dashboardStatsSchema);

export default DashboardStats;
