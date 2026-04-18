import Order from '../../models/Order.js';
import Coupon from '../../models/Coupon.js';

/**
 * GET /customer/status
 * Returns a "Nudge Payload" based on user history and active offers.
 * Used by Flutter/Web to control banners, suggested brands, and pending actions.
 */
export const getCustomerStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const brand = req.params.brand || req.query.brand;

        // If user is not logged in, return a generic "guest" status
        if (!userId) {
            const activeCoupons = await Coupon.find({
                isActive: true,
                expiryDate: { $gt: new Date() },
                firstOrderOnly: true
            }).select('code').limit(2).lean();

            return res.json({
                success: true,
                data: {
                    showWelcomeBanner: true,
                    suggestedBrand: brand || 'teasntrees',
                    activeOffers: activeCoupons.map(c => c.code),
                    lastOrderRatingPending: null,
                    isGuest: true
                }
            });
        }

        // 1. Check for First Order (Welcome Banner)
        const nonCancelledOrders = await Order.find({
            customerId: userId,
            status: { $nin: ['cancelled'] }
        }).select('brand').lean();

        const orderCount = nonCancelledOrders.length;
        const showWelcomeBanner = orderCount === 0;

        // 2. Determine Suggested Brand
        // If they have ordered, suggest the brand they order from most.
        // If not, suggest the brand they are currently viewing or teasntrees as default.
        let suggestedBrand = brand || 'teasntrees';
        if (orderCount > 0) {
            const brandCounts = nonCancelledOrders.reduce((acc, o) => {
                acc[o.brand] = (acc[o.brand] || 0) + 1;
                return acc;
            }, {});
            suggestedBrand = Object.keys(brandCounts).reduce((a, b) => brandCounts[a] > brandCounts[b] ? a : b);
        }

        // 3. Fetch Active Offers (Relevant to user)
        const activeCouponsQuery = {
            isActive: true,
            expiryDate: { $gt: new Date() },
            $or: [
                { brand: null },
                { brand: suggestedBrand }
            ]
        };
        // Exclude firstOrderOnly if they already ordered
        if (orderCount > 0) {
            activeCouponsQuery.firstOrderOnly = false;
        }

        const activeCoupons = await Coupon.find(activeCouponsQuery)
            .select('code')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        // 4. Last Order Rating Pending
        // Find last DELIVERED order that doesn't have a foodRating or riderRating
        const lastDeliveredOrder = await Order.findOne({
            customerId: userId,
            status: 'delivered',
            $or: [
                { foodRating: { $exists: false } },
                { foodRating: null },
                { riderRating: { $exists: false } },
                { riderRating: null }
            ]
        })
        .sort({ deliveredAt: -1 })
        .select('_id')
        .lean();

        res.json({
            success: true,
            data: {
                showWelcomeBanner,
                suggestedBrand,
                activeOffers: activeCoupons.map(c => c.code),
                lastOrderRatingPending: lastDeliveredOrder ? lastDeliveredOrder._id : null
            }
        });

    } catch (err) {
        console.error('getCustomerStatus error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
