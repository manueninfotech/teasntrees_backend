// Admin Cart Analytics Controller
// For monitoring cart health and customer behavior

import Cart from '../../models/Cart.js';

// Get cart analytics
export const getCartAnalytics = async (req, res) => {
    try {
        // Total carts with items
        const activeCarts = await Cart.find({ 'items.0': { $exists: true } });
        const totalActiveCarts = activeCarts.length;

        // Empty carts (considered abandoned)
        const emptyCarts = await Cart.find({ items: { $size: 0 } });
        const totalAbandonedCarts = emptyCarts.length;

        // Calculate average cart value
        let totalCartValue = 0;
        let totalItemsInCarts = 0;
        const itemFrequency = {};

        for (const cart of activeCarts) {
            totalCartValue += cart.subtotal;
            totalItemsInCarts += cart.items.length;

            // Track popular items
            for (const item of cart.items) {
                if (!item.product) continue; // Skip items with no product reference
                const productId = item.product.toString();
                if (!itemFrequency[productId]) {
                    itemFrequency[productId] = {
                        productId,
                        name: item.name || 'Unknown Item',
                        count: 0,
                        totalQuantity: 0
                    };
                }
                itemFrequency[productId].count += 1;
                itemFrequency[productId].totalQuantity += item.quantity;
            }
        }

        const averageCartValue = totalActiveCarts > 0
            ? (totalCartValue / totalActiveCarts).toFixed(2)
            : 0;

        // Get top 10 popular items in carts
        const popularCartItems = Object.values(itemFrequency)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(item => ({
                productId: item.productId,
                name: item.name,
                inCartsCount: item.count,
                totalQuantity: item.totalQuantity
            }));

        // Abandoned carts (with items but not updated in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const abandonedWithItems = await Cart.find({
            'items.0': { $exists: true },
            updatedAt: { $lt: sevenDaysAgo }
        }).countDocuments();

        res.json({
            success: true,
            data: {
                totalActiveCarts,
                totalAbandonedCarts: abandonedWithItems,
                emptyCartsCount: totalAbandonedCarts,
                averageCartValue: parseFloat(averageCartValue),
                totalItemsInCarts,
                popularCartItems,
                lastUpdated: new Date()
            }
        });

    } catch (error) {
        console.error('Error in getCartAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart analytics'
        });
    }
};

// Get abandoned carts details
export const getAbandonedCarts = async (req, res) => {
    try {
        const { days = 7, page = 1, limit = 10 } = req.query;

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        const skip = (page - 1) * limit;

        const abandonedCarts = await Cart.find({
            'items.0': { $exists: true },
            updatedAt: { $lt: daysAgo }
        })
            .populate('userId', 'name mobile email')
            .populate('items.product', 'name price')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Cart.countDocuments({
            'items.0': { $exists: true },
            updatedAt: { $lt: daysAgo }
        });

        res.json({
            success: true,
            data: {
                abandonedCarts: abandonedCarts
                    .filter(cart => cart.userId) // Filter out carts with missing users
                    .map(cart => ({
                        userId: cart.userId._id,
                        userName: cart.userId.name,
                        userMobile: cart.userId.mobile,
                        items: cart.items.map(item => ({
                            ...item.toObject(),
                            name: item.product ? item.product.name : (item.name || 'Unknown Product')
                        })),
                        subtotal: cart.subtotal,
                        itemCount: cart.items.length,
                        lastUpdated: cart.updatedAt,
                        daysAbandoned: Math.floor((new Date() - cart.updatedAt) / (1000 * 60 * 60 * 24))
                    })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalAbandoned: total,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error in getAbandonedCarts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch abandoned carts'
        });
    }
};
