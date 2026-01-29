// Add assignRider in Order Controller
export const assignRider = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const rider = await Rider.findOne({ _id: riderId, isApproved: true, isActive: true });
        if (!rider) return res.status(400).json({ message: 'Invalid or inactive rider' });

        // Update Order
        order.rider = rider._id;
        order.status = 'assigned';
        order.handledBy = req.user.userId; // Track manager

        order.timeline.push({
            status: 'assigned',
            timestamp: new Date(),
            description: `Assigned to rider ${rider.name} by Manager ${req.user.name}`
        });

        await order.save();

        // Notify
        const io = req.app.get('io');
        if (io) {
            io.to(SOCKET_ROOMS.order(orderId)).emit(SOCKET_EVENTS.ORDER_UPDATED, order);
            io.to(SOCKET_ROOMS.user(riderId)).emit(SOCKET_EVENTS.NEW_ORDER_ASSIGNED, order);
        }

        res.status(200).json({ success: true, data: order });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
