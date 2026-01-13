// Customer Delivery Tracking Controller
// Track order delivery in real-time

import Delivery from '../../models/Delivery.js';
import Order from '../../models/Order.js';

// Get customer's active deliveries
export const getMyDeliveries = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const deliveries = await Delivery.find({ customerId })
            .populate('orderId', 'orderNumber items total')
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: deliveries
        });

    } catch (error) {
        console.error('Error in getMyDeliveries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries'
        });
    }
};

// Track specific delivery (real-time)
export const trackDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const customerId = req.user.userId;

        const delivery = await Delivery.findOne({
            _id: deliveryId,
            customerId
        })
            .populate('orderId', 'orderNumber items total deliveryAddress')
            .populate('riderId', 'name mobile');

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        // Calculate estimated time remaining (if available)
        let estimatedArrival = null;
        if (delivery.estimatedTime && delivery.status === 'in_transit') {
            const elapsed = (new Date() - delivery.pickedUpAt) / 1000 / 60; // minutes
            const remaining = Math.max(0, delivery.estimatedTime - elapsed);
            estimatedArrival = remaining;
        }

        res.json({
            success: true,
            data: {
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,
                rider: {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile
                },
                currentLocation: delivery.pickupLocation || null,
                deliveryLocation: delivery.deliveryLocation,
                distance: delivery.distance,
                estimatedTime: delivery.estimatedTime,
                estimatedArrival,  // Minutes remaining
                assignedAt: delivery.assignedAt,
                pickedUpAt: delivery.pickedUpAt,
                deliveredAt: delivery.deliveredAt,
                order: {
                    orderNumber: delivery.orderId.orderNumber,
                    total: delivery.orderId.total,
                    deliveryAddress: delivery.orderId.deliveryAddress
                }
            }
        });

    } catch (error) {
        console.error('Error in trackDelivery:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track delivery'
        });
    }
};

// Get delivery by order ID
export const getDeliveryByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.userId;

        // Verify order belongs to customer
        const order = await Order.findOne({
            _id: orderId,
            customerId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const delivery = await Delivery.findOne({ orderId })
            .populate('riderId', 'name mobile');

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found for this order'
            });
        }

        // Calculate real-time ETA
        let estimatedArrival = null;
        if (delivery.estimatedTime && ['picked_up', 'in_transit'].includes(delivery.status)) {
            const elapsed = (new Date() - delivery.pickedUpAt) / 1000 / 60;
            const remaining = Math.max(0, delivery.estimatedTime - elapsed);
            estimatedArrival = Math.round(remaining);
        }

        res.json({
            success: true,
            data: {
                deliveryId: delivery._id,
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,
                rider: delivery.riderId ? {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile
                } : null,
                currentLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,
                distance: delivery.distance,
                estimatedTime: delivery.estimatedTime,
                estimatedArrival,
                statusUpdates: {
                    assigned: delivery.assignedAt,
                    pickedUp: delivery.pickedUpAt,
                    delivered: delivery.deliveredAt
                }
            }
        });

    } catch (error) {
        console.error('Error in getDeliveryByOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery'
        });
    }
};
