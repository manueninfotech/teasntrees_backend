import Delivery from '../../models/Delivery.js';

export const getActiveDeliveries = async (req, res) => {
    try {
        // Fetch deliveries that are in progress
        const activeStatuses = ['picked_up', 'out-for-delivery', 'in_transit', 'arrived_at_pickup', 'heading_to_pickup', 'accepted'];

        const deliveries = await Delivery.find({
            status: { $in: activeStatuses }
        })
            .populate('riderId', 'name mobile currentLocation isOnline')
            .populate('orderId', 'orderNumber total items')
            .populate('customerId', 'name mobile')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: deliveries });

    } catch (error) {
        console.error("Error fetching active deliveries:", error);
        res.status(500).json({ success: false, message: 'Error fetching active deliveries' });
    }
};
