import Delivery from '../../models/Delivery.js';
import Order from '../../models/Order.js';

/* --------------------------------------------------
   Helper: Build Status Timeline
-------------------------------------------------- */
const buildTimeline = (delivery) => {
    const timeline = [];

    const push = (status, time) => {
        if (time) timeline.push({ status, timestamp: time });
    };

    // Always start with when it was ready for a rider
    push('waiting_for_rider', delivery.createdAt);

    push('assigned', delivery.assignedAt);
    push('accepted', delivery.acceptedAt);
    push('heading_to_pickup', delivery.acceptedAt);
    push('arrived_at_pickup', delivery.arrivedAtPickup);
    push('picked_up', delivery.pickedUpAt);
    push('in_transit', delivery.pickedUpAt);
    push('arrived', delivery.arrivedAt);
    push('delivered', delivery.deliveredAt);
    push('cancelled', delivery.cancelledAt);

    return timeline;
};

/* --------------------------------------------------
   Helper: Calculate ETA (minutes)
-------------------------------------------------- */
const calculateETA = (delivery) => {
    if (!delivery.estimatedTime || !delivery.pickedUpAt) return null;

    const elapsed = (Date.now() - delivery.pickedUpAt.getTime()) / 60000;
    return Math.max(0, Math.round(delivery.estimatedTime - elapsed));
};

/* ==================================================
   GET CUSTOMER DELIVERIES (LIST)
================================================== */
export const getMyDeliveries = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const deliveries = await Delivery.find({ customerId })
            .populate('orderId', 'orderNumber total deliveryAddress estimatedDeliveryTime')
            .populate('riderId', 'name mobile currentLocation')
            .sort({ createdAt: -1 })
            .limit(10);

        const result = deliveries.map(delivery => {
            const eta = calculateETA(delivery);

            return {
                deliveryId: delivery._id,
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,
                updatedAt: delivery.updatedAt,

                rider: delivery.riderId ? {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile,
                    location: delivery.riderId.currentLocation || null
                } : null,

                pickupLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,
                distance: delivery.distance,

                estimatedTime: delivery.estimatedTime,
                estimatedArrival: eta,

                order: {
                    orderId: delivery.orderId?._id,
                    orderNumber: delivery.orderId?.orderNumber,
                    total: delivery.orderId?.total
                },

                statusHistory: buildTimeline(delivery),

                deliveryAddress: delivery.orderId?.deliveryAddress,

                // OTP only when rider is near
                deliveryOtp:
                    ['picked_up', 'in_transit', 'arrived', 'out-for-delivery', 'out_for_delivery'].includes(delivery.status)
                        ? delivery.deliveryOtp
                        : null
            };
        });

        res.json({ success: true, data: result });

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
            .populate('orderId', 'orderNumber total deliveryAddress estimatedDeliveryTime')
            .populate('riderId', 'name mobile currentLocation');

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        res.json({
            success: true,
            data: {
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,

                rider: delivery.riderId ? {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile,
                    location: delivery.riderId.currentLocation || null
                } : null,

                pickupLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,

                estimatedTime: delivery.estimatedTime,
                estimatedArrival: calculateETA(delivery),

                statusHistory: buildTimeline(delivery),

                order: {
                    orderNumber: delivery.orderId.orderNumber,
                    total: delivery.orderId.total,
                    deliveryAddress: delivery.orderId.deliveryAddress
                },

                deliveryOtp:
                    ['picked_up', 'in_transit', 'arrived', 'out-for-delivery', 'out_for_delivery'].includes(delivery.status)
                        ? delivery.deliveryOtp
                        : null
            }
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
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const delivery = await Delivery.findOne({ orderId: order._id })
            .populate('riderId', 'name mobile currentLocation');

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        res.json({
            success: true,
            data: {
                deliveryId: delivery._id,
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,

                rider: delivery.riderId ? {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile,
                    location: delivery.riderId.currentLocation || null
                } : null,

                estimatedTime: delivery.estimatedTime,
                estimatedArrival: calculateETA(delivery),

                pickupLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,

                deliveryAddress: order.deliveryAddress,

                deliveryOtp:
                    ['picked_up', 'in_transit', 'arrived', 'out-for-delivery', 'out_for_delivery'].includes(delivery.status)
                        ? delivery.deliveryOtp
                        : null
            }
        });

    } catch (error) {
        console.error('getDeliveryByOrder error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch delivery' });
    }
};

