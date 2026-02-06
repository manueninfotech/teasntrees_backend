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
            'assigned',
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

        // Shape data for dashboard / map - Keys must match frontend (riderId, orderId, customerId)
        const data = deliveries.map(d => ({
            _id: d._id,
            deliveryNumber: d.deliveryNumber,
            status: d.status,
            updatedAt: d.updatedAt,

            riderId: d.riderId ? {
                _id: d.riderId._id,
                name: d.riderId.name,
                mobile: d.riderId.mobile,
                isOnline: d.riderId.isOnline,
                currentLocation: d.riderId.currentLocation || null
            } : null,

            orderId: d.orderId ? {
                _id: d.orderId._id,
                orderNumber: d.orderId.orderNumber,
                total: d.orderId.total
            } : null,

            customerId: d.customerId ? {
                _id: d.customerId._id,
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
