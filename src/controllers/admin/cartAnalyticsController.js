// Admin Cart Analytics Controller
// For monitoring cart health and customer behavior

import Cart from '../../models/Cart.js';

const isItemForBrand = (item, brand) => {
    if (!brand) return true;
    const effectiveBrand = item.product?.brand || item.brand || null;
    if (effectiveBrand) return effectiveBrand === brand;

    // Legacy fallback only when brand info is unavailable on both cart item and product
    return brand === 'teasntrees';
};

const filterItemsByBrand = (items, brand) => items.filter(item => isItemForBrand(item, brand));

const applyCartBrandFilter = (filter, brand) => {
    if (!brand) return filter;

    // Backward compatibility: older cart items may not have brand saved.
    // Treat missing/null brand as teasntrees (legacy default).
    if (brand === 'teasntrees') {
        filter.$or = [
            { 'items.brand': 'teasntrees' },
            { 'items.brand': { $exists: false } },
            { 'items.brand': null }
        ];
        return filter;
    }

    filter['items.brand'] = brand;
    return filter;
};

// Get cart analytics
export const getCartAnalytics = async (req, res) => {
    try {
        const brand = req.activeBrand;
        // build a common base filter for items
        const baseFilter = { 'items.0': { $exists: true } };
        applyCartBrandFilter(baseFilter, brand);

        // Total carts with items
        const activeCarts = await Cart.find(baseFilter)
            .populate('items.product', 'name brand');
        const totalActiveCarts = activeCarts.length;

        // Empty carts (considered abandoned) ignore brand since no items
        const emptyFilter = {};
        if (brand) {
            // carts where items are present but filtered by brand? actually empty carts have no items so brand irrelevant
            // keep as empty
        }
        const emptyCarts = await Cart.find({ items: { $size: 0 } });
        const totalAbandonedCarts = emptyCarts.length;

        // Calculate average cart value
        let totalCartValue = 0;
        let totalItemsInCarts = 0;
        const itemFrequency = {};

        for (const cart of activeCarts) {
            const scopedItems = filterItemsByBrand(cart.items, brand);
            if (!scopedItems.length) continue;

            totalCartValue += scopedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalItemsInCarts += scopedItems.length;

            // Track popular items
            for (const item of scopedItems) {
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

        const abandonedFilter = {
            'items.0': { $exists: true },
            updatedAt: { $lt: sevenDaysAgo }
        };
        applyCartBrandFilter(abandonedFilter, brand);
        const abandonedWithItems = await Cart.find(abandonedFilter).countDocuments();

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
        const brand = req.activeBrand;
        const days = Math.max(parseInt(req.query.days, 10) || 7, 1);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        const skip = (page - 1) * limit;

        const cartFilter = {
            'items.0': { $exists: true },
            updatedAt: { $lt: daysAgo }
        };
        applyCartBrandFilter(cartFilter, brand);
        const abandonedCarts = await Cart.find(cartFilter)
            .populate('userId', 'name mobile email')
            .populate('items.product', 'name price brand')
            .sort({ updatedAt: -1 })
            .limit(limit)
            .skip(skip);

        const totalFilter = {
            'items.0': { $exists: true },
            updatedAt: { $lt: daysAgo }
        };
        applyCartBrandFilter(totalFilter, brand);
        const total = await Cart.countDocuments(totalFilter);

        res.json({
            success: true,
            data: {
                abandonedCarts: abandonedCarts
                    .filter(cart => cart.userId) // Filter out carts with missing users
                    .map(cart => {
                        const scopedItems = filterItemsByBrand(cart.items, brand).map(item => ({
                            ...item.toObject(),
                            name: item.product ? item.product.name : (item.name || 'Unknown Product')
                        }));
                        const scopedSubtotal = scopedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

                        return {
                        userId: cart.userId._id,
                        userName: cart.userId.name,
                        userMobile: cart.userId.mobile,
                        items: scopedItems,
                        subtotal: scopedSubtotal,
                        itemCount: scopedItems.length,
                        lastUpdated: cart.updatedAt,
                        daysAbandoned: Math.floor((new Date() - cart.updatedAt) / (1000 * 60 * 60 * 24))
                    };})
                    .filter(cart => cart.itemCount > 0),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalAbandoned: total,
                    limit
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
