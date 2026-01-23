import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Delivery from '../../models/Delivery.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get total counts
        const totalOrders = await Order.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalProducts = await Product.countDocuments();
        const totalRiders = await User.countDocuments({ role: 'rider' });
        const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
        const pendingOrders = await Order.countDocuments({ status: 'pending' });

        // Get today's data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // Today's revenue from orders delivered today with paid status
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    deliveredAt: { $gte: today },
                    status: 'delivered',
                    paymentStatus: 'paid'
                }
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        // Get active orders
        const activeOrders = await Order.countDocuments({
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
        });

        // Get total revenue from delivered orders with paid status
        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Get order status breakdown
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'name')
            .select('orderNumber items total status createdAt');

        // Get top products
        const topProducts = await Product.find()
            .sort({ orderCount: -1 })
            .limit(4)
            .select('name orderCount');

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalCustomers,
                totalProducts,
                totalRiders,
                activeRiders,
                pendingOrders,
                totalRevenue,
                activeOrders,
                todayOrders,
                todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
                ordersByStatus,
                recentOrders,
                topProducts
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