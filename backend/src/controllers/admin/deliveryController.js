import Delivery from '../../models/Delivery.js';
import Order from '../../models/Order.js';
import activityLogService from '../../services/activityLogService.js';

/* ----------------------------------
   GET ALL DELIVERIES (ADMIN)
----------------------------------- */
export const getAllDeliveries = async (req, res) => {
    try {
        const { status, riderId, startDate, endDate, brand } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (riderId) query.riderId = riderId;

        // Brand filtering logic: Delivery schema does not have 'brand'. We filter by Order.
        if (brand) {
            const filteredOrders = await Order.find({ brand }).select('_id');
            query.orderId = { $in: filteredOrders.map(o => o._id) };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const deliveries = await Delivery.find(query)
            .populate('orderId', 'orderNumber total status brand')
            .populate('riderId', 'name mobile')
            .populate('customerId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Delivery.countDocuments(query);

        res.json({
            success: true,
            data: deliveries,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ----------------------------------
   GET DELIVERY BY ID (ADMIN)
----------------------------------- */
export const getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('orderId')
            .populate('riderId', 'name mobile')
            .populate('customerId', 'name mobile');

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        res.json({ success: true, data: delivery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ----------------------------------
   ADMIN: CANCEL DELIVERY (SAFE)
----------------------------------- */
export const cancelDelivery = async (req, res) => {
    try {
        const { reason } = req.body;

        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        if (['delivered', 'cancelled'].includes(delivery.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed delivery'
            });
        }

        delivery.status = 'cancelled';
        delivery.cancelReason = reason || 'Cancelled by admin';
        delivery.cancelledAt = new Date();

        await delivery.save(); // 🔥 Order sync happens automatically

        res.json({
            success: true,
            message: 'Delivery cancelled successfully',
            data: delivery
        });

        // Log Activity
        await activityLogService.log(req, {
            action: 'cancel',
            resource: 'delivery',
            resourceId: delivery._id,
            details: { reason: delivery.cancelReason }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ----------------------------------
   DELIVERY STATISTICS (ADMIN)
----------------------------------- */
export const getDeliveryStats = async (req, res) => {
    try {
        const { brand } = req.query;
        const query = {};

        if (brand) {
            const filteredOrders = await Order.find({ brand }).select('_id');
            query.orderId = { $in: filteredOrders.map(o => o._id) };
        }

        const [
            totalDeliveries,
            activeDeliveries,
            completedDeliveries,
            cancelledDeliveries
        ] = await Promise.all([
            Delivery.countDocuments(query),
            Delivery.countDocuments({
                ...query,
                status: { $in: ['pending_acceptance', 'accepted', 'heading_to_pickup', 'picked_up', 'in_transit'] }
            }),
            Delivery.countDocuments({ ...query, status: 'delivered' }),
            Delivery.countDocuments({ ...query, status: 'cancelled' })
        ]);

        const earnings = await Delivery.aggregate([
            { $match: { ...query, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalEarning' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalDeliveries,
                activeDeliveries,
                completedDeliveries,
                cancelledDeliveries,
                totalEarnings: earnings[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
