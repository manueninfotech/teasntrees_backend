import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Delivery from '../../models/Delivery.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get total counts
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalDeliveries = await Delivery.countDocuments();

        // Get today's data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        const todayRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: today }, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        // Get active orders
        const activeOrders = await Order.countDocuments({
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
        });

        // Get total revenue
        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Get order status breakdown
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    totalUsers,
                    totalProducts,
                    totalDeliveries,
                    totalRevenue,
                    activeOrders
                },
                today: {
                    orders: todayOrders,
                    revenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0
                },
                ordersByStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};

// Get revenue analytics
export const getRevenueAnalytics = async (req, res) => {
    try {
        const { period = 'week' } = req.query; // week, month, year

        let startDate = new Date();

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        const revenueData = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: revenueData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue analytics',
            error: error.message
        });
    }
};

// Get top selling products
export const getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topProducts = await Product.find()
            .sort({ orderCount: -1 })
            .limit(parseInt(limit))
            .select('name price orderCount averageRating image category')
            .populate('category', 'name icon');
        res.status(200).json({
            success: true,
            count: topProducts.length,
            data: topProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching top products',
            error: error.message
        });
    }
};

// Get recent orders
export const getRecentOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('customerId', 'name email')
            .populate('items.product', 'name price')
            .select('orderNumber total status createdAt customerId');
        res.status(200).json({
            success: true,
            count: recentOrders.length,
            data: recentOrders
        });
    } catch (error) {
        console.error('GetRecentOrders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent orders',
            error: error.message
        });
    }
}