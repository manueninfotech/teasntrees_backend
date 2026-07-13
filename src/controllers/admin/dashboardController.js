import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const brand = req.activeBrand;
        const queryOrder = brand ? { brand } : {};
        const queryProduct = brand ? { brand } : {};

        // Get total counts
        const totalOrders = await Order.countDocuments(queryOrder);
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalProducts = await Product.countDocuments(queryProduct);
        const totalRiders = await User.countDocuments({ role: 'rider' });
        const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
        const pendingOrders = await Order.countDocuments({ ...queryOrder, status: 'pending' });

        // Get today's data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({
            ...queryOrder,
            createdAt: { $gte: today }
        });

        // Today's revenue from orders delivered today with paid status
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    ...queryOrder,
                    deliveredAt: { $gte: today },
                    status: 'delivered',
                    paymentStatus: 'paid'
                }
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        // Get active orders
        const activeOrders = await Order.countDocuments({
            ...queryOrder,
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
        });

        // Get total revenue from delivered orders with paid status
        const revenueData = await Order.aggregate([
            { $match: { ...queryOrder, status: 'delivered', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Get order status breakdown
        const ordersByStatus = await Order.aggregate([
            { $match: queryOrder },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get recent orders
        const recentOrders = await Order.find(queryOrder)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'name')
            .select('orderNumber items total status createdAt brand');

        // Get top products (Accurate Best Sellers - only delivered)
        const topProducts = await Order.aggregate([
            { $match: { ...queryOrder, status: 'delivered' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    orderCount: { $sum: '$items.quantity' }
                }
            },
            { $sort: { orderCount: -1 } },
            { $limit: 4 }
        ]);

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
        const brand = req.activeBrand;
        const queryOrder = brand ? { brand } : {};

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
                    ...queryOrder,
                    status: 'delivered',
                    paymentStatus: 'paid',
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

// Get top selling products (Detailed list)
export const getTopProducts = async (req, res) => {
    try {
        const { limit = 10, brand } = req.query;
        const queryOrder = brand ? { brand } : {};

        const topProducts = await Order.aggregate([
            { $match: { ...queryOrder, status: 'delivered' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    orderCount: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { orderCount: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: 1,
                    orderCount: 1,
                    totalRevenue: 1,
                    price: { $ifNull: ['$productDetails.price', { $arrayElemAt: ['$productDetails.sizeOptions.price', 0] }] },
                    image: '$productDetails.image',
                    category: '$productDetails.category',
                    averageRating: '$productDetails.averageRating'
                }
            }
        ]);

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
        const { limit = 10, brand } = req.query;
        const queryOrder = brand ? { brand } : {};
        const recentOrders = await Order.find(queryOrder)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('customerId', 'name email')
            .populate('items.product', 'name price')
            .select('orderNumber total status createdAt customerId brand');
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
};
