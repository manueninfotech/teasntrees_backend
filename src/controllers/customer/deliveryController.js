import Delivery from '../../models/Delivery.js';
import Order from '../../models/Order.js';

const buildTimeline = (delivery, order) => {
    const timeline = [];

    const push = (status, timestamp, description) => {
        if (timestamp) {
            timeline.push({ status, timestamp, description });
        }
    };

    push('pending', order?.createdAt, 'Order created');
    push('confirmed', order?.confirmedAt, 'Order confirmed');
    push('preparing', order?.confirmedAt, 'Order is being prepared');
    push('ready', delivery?.createdAt || order?.updatedAt, 'Order is ready for pickup');
    push(delivery?.status, delivery?.updatedAt, 'Delivery status update');
    push('delivered', delivery?.deliveredAt || order?.deliveredAt, 'Delivered');
    push('cancelled', delivery?.cancelledAt || order?.cancelledAt, 'Cancelled');

    return timeline.filter((item, index, arr) =>
        item.status && arr.findIndex((candidate) => candidate.status === item.status && String(candidate.timestamp) === String(item.timestamp)) === index
    );
};

const shapeDelivery = (delivery, order) => ({
    deliveryId: delivery._id,
    deliveryNumber: delivery.deliveryNumber,
    status: delivery.status,
    updatedAt: delivery.updatedAt,
    estimatedTime: delivery.estimatedTime,
    pickupLocation: delivery.pickupLocation,
    deliveryLocation: delivery.deliveryLocation,
    order: order ? {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        deliveryAddress: order.deliveryAddress
    } : null,
    statusHistory: buildTimeline(delivery, order),
    rider: delivery.riderId ? {
        name: delivery.riderId.name,
        mobile: delivery.riderId.mobile,
        currentLocation: delivery.riderId.currentLocation
    } : null,
    deliveryOtp: delivery.deliveryOtp || null
});

/* ==================================================
   GET CUSTOMER DELIVERIES (LIST)
================================================== */
export const getMyDeliveries = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const deliveries = await Delivery.find({ customerId })
            .select('deliveryNumber status createdAt updatedAt pickupLocation deliveryLocation estimatedTime deliveredAt cancelledAt orderId riderId deliveryOtp')
            .populate({
                path: 'orderId',
                select: 'orderNumber total deliveryAddress createdAt confirmedAt deliveredAt cancelledAt updatedAt',
                options: { lean: true }
            })
            .populate('riderId', 'name mobile currentLocation')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            data: deliveries.map((delivery) => shapeDelivery(delivery, delivery.orderId))
        });

    } catch (error) {
        console.error('getMyDeliveries error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch deliveries' });
    }
};

/* ==================================================
   TRACK A SINGLE DELIVERY
================================================== */
export const trackDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const customerId = req.user.userId;

        const delivery = await Delivery.findOne({
            _id: deliveryId,
            customerId
        })
            .select('deliveryNumber status createdAt updatedAt pickupLocation deliveryLocation estimatedTime deliveredAt cancelledAt orderId riderId deliveryOtp')
            .populate({
                path: 'orderId',
                select: 'orderNumber total deliveryAddress createdAt confirmedAt deliveredAt cancelledAt updatedAt',
                options: { lean: true }
            })
            .populate('riderId', 'name mobile currentLocation')
            .lean();

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        res.json({
            success: true,
            data: shapeDelivery(delivery, delivery.orderId)
        });

    } catch (error) {
        console.error('trackDelivery error:', error);
        res.status(500).json({ success: false, message: 'Failed to track delivery' });
    }
};

/* ==================================================
   GET DELIVERY BY ORDER ID
================================================== */
export const getDeliveryByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        const order = await Order.findOne({
            _id: orderId,
            customerId
        }).select('_id orderNumber total deliveryAddress createdAt confirmedAt deliveredAt cancelledAt updatedAt').lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const delivery = await Delivery.findOne({ orderId: order._id })
            .select('deliveryNumber status createdAt updatedAt pickupLocation deliveryLocation estimatedTime deliveredAt cancelledAt orderId riderId deliveryOtp')
            .populate('riderId', 'name mobile currentLocation')
            .lean();

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        res.json({
            success: true,
            data: shapeDelivery(delivery, order)
        });

    } catch (error) {
        console.error('getDeliveryByOrder error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch delivery' });
    }
};
