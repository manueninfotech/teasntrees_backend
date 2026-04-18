// Manager Dashboard Controller
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Rider from '../../models/Rider.js';

export const getDashboardStats = async (req, res) => {
    try {
        const brand = req.params.brand || 'teasntrees';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Orders Today & Sales
        const todayOrders = await Order.find({
            brand,
            createdAt: { $gte: today }
        });

        const totalOrdersToday = todayOrders.length;
        const totalSalesToday = todayOrders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.total || 0), 0);

        const pendingOrders = await Order.countDocuments({
            brand,
            status: 'pending'
        });

        const preparingOrders = await Order.countDocuments({
            brand,
            status: 'preparing'
        });

        // 3. Active Riders (Online/Active)
        const activeRiders = await Rider.countDocuments({
            isApproved: true,
            isActive: true
        });

        const onlineRiders = await Rider.countDocuments({
            isOnline: true
        });

        // 4. Delayed Deliveries (e.g. status not delivered AND created > 1 hour ago? or estimatedDeliveryTime passed?)
        // Let's assume delayed if status is in-progress and estimatedDeliveryTime < now
        const delayedOrders = await Order.countDocuments({
            brand,
            status: { $in: ['out_for_delivery', 'preparing', 'in_transit'] },
            estimatedDeliveryTime: { $lt: new Date() }
        });

        const lowStockProducts = await Product.countDocuments({
            brand,
            isAvailable: false
        });

        // 6. Recent Orders (Last 5)
        const recentOrders = await Order.find({ brand })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'name mobile')
            .select('orderNumber items total subtotal status createdAt paymentStatus paymentMethod deliveryAddress specialInstructions customerId');

        // 7. Active Riders List (Limit 5)
        const activeRidersList = await Rider.find({ isApproved: true, isActive: true })
            .limit(5)
            .select('name mobile isOnline');

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    ordersToday: totalOrdersToday,
                    salesToday: totalSalesToday,
                    pendingOrders,
                    preparingOrders,
                    delayedOrders
                },
                riders: {
                    active: activeRiders,
                    online: onlineRiders,
                    list: activeRidersList
                },
                inventory: {
                    lowStock: lowStockProducts
                },
                recentOrders
            }
        });

    } catch (error) {
        console.error('Manager Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};
