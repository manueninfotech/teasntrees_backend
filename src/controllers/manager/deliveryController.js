import Delivery from '../../models/Delivery.js';

/* =========================================================
   GET ACTIVE DELIVERIES (MANAGER DASHBOARD)
========================================================= */
export const getActiveDeliveries = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20
        } = req.query;

        const skip = (page - 1) * limit;

        // Only true active delivery states (Delivery domain)
        const activeStatuses = [
            'accepted',
            'heading_to_pickup',
            'arrived_at_pickup',
            'picked_up',
            'in_transit',
            'arrived'
        ];

        const deliveries = await Delivery.find({
            status: { $in: activeStatuses }
        })
            .populate('riderId', 'name mobile currentLocation isOnline')
            .populate('orderId', 'orderNumber total')
            .populate('customerId', 'name mobile')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Delivery.countDocuments({
            status: { $in: activeStatuses }
        });

        // Shape data for dashboard / map
        const data = deliveries.map(d => ({
            deliveryId: d._id,
            deliveryNumber: d.deliveryNumber,
            status: d.status,
            updatedAt: d.updatedAt,

            rider: d.riderId ? {
                id: d.riderId._id,
                name: d.riderId.name,
                mobile: d.riderId.mobile,
                isOnline: d.riderId.isOnline,
                location: d.riderId.currentLocation || null
            } : null,

            order: d.orderId ? {
                orderId: d.orderId._id,
                orderNumber: d.orderId.orderNumber,
                total: d.orderId.total
            } : null,

            customer: d.customerId ? {
                name: d.customerId.name,
                mobile: d.customerId.mobile
            } : null,

            pickupLocation: d.pickupLocation,
            deliveryLocation: d.deliveryLocation,
            estimatedTime: d.estimatedTime
        }));

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching active deliveries:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active deliveries'
        });
    }
};
