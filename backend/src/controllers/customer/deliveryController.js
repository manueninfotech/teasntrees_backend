// Customer Delivery Tracking Controller
// Track order delivery in real-time

import Delivery from '../../models/Delivery.js';
import Order from '../../models/Order.js';

// Get customer's active deliveries
export const getMyDeliveries = async (req, res) => {
    try {
        const customerId = req.user.userId;

        const deliveries = await Delivery.find({ customerId })
            .populate({
                path: 'orderId',
                select: 'orderNumber items total deliveryAddress estimatedDeliveryTime'
            })
            .populate('riderId', 'name mobile')
            .sort({ createdAt: -1 })
            .limit(10);

        // Transform to match the tracking page's expected structure
        const transformedDeliveries = deliveries.map(delivery => {
            const order = delivery.orderId || {};

            // Calculate real-time ETA
            let estimatedArrival = null;
            if (delivery.estimatedTime && ['picked_up', 'in_transit'].includes(delivery.status) && delivery.pickedUpAt) {
                const elapsed = (new Date() - delivery.pickedUpAt) / 1000 / 60;
                const remaining = Math.max(0, delivery.estimatedTime - elapsed);
                estimatedArrival = Math.round(remaining);
            }

            // Build a status history for the timeline
            const statusHistory = [
                { status: 'assigned', timestamp: delivery.assignedAt || delivery.createdAt },
                { status: 'picked_up', timestamp: delivery.pickedUpAt },
                { status: 'delivered', timestamp: delivery.deliveredAt }
            ].filter(h => h.timestamp);

            console.log(`[Tracking] User ${customerId} view delivery ${delivery._id}. History count: ${statusHistory.length}`);

            return {
                deliveryId: delivery._id,
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,
                updatedAt: delivery.updatedAt,
                rider: delivery.riderId ? {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile
                } : null,
                currentLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,
                distance: delivery.distance,
                estimatedTime: delivery.estimatedTime,
                estimatedArrival,
                order: {
                    orderNumber: order.orderNumber,
                    _id: order._id,
                    total: order.total
                },
                statusHistory,
                deliveryAddress: order.deliveryAddress,
                estimatedDeliveryTime: order.estimatedDeliveryTime
            };
        });

        res.json({
            success: true,
            data: transformedDeliveries
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

        // Check if deliveryId is a valid ObjectId
        const isObjectId = deliveryId.match(/^[0-9a-fA-F]{24}$/);

        let query = { customerId };
        if (isObjectId) {
            query._id = deliveryId;
        } else {
            query.deliveryNumber = deliveryId; // Assuming schema has deliveryNumber
        }

        const delivery = await Delivery.findOne(query)
            .populate('orderId', 'orderNumber items total deliveryAddress estimatedDeliveryTime')
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
                estimatedDeliveryTime: delivery.orderId.estimatedDeliveryTime,
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
        // Check if orderId is a valid ObjectId
        const isObjectId = orderId.match(/^[0-9a-fA-F]{24}$/);

        let query = { customerId };
        if (isObjectId) {
            query._id = orderId;
        } else {
            query.orderNumber = orderId;
        }

        const order = await Order.findOne(query);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Use the found order's _id to look up the delivery
        const deliveryQuery = { orderId: order._id };

        const delivery = await Delivery.findOne(deliveryQuery)
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
                updatedAt: delivery.updatedAt,
                rider: delivery.riderId ? {
                    name: delivery.riderId.name,
                    mobile: delivery.riderId.mobile
                } : null,
                currentLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,
                distance: delivery.distance,
                estimatedTime: delivery.estimatedTime,
                estimatedArrival,
                // Include estimatedDeliveryTime from order
                estimatedDeliveryTime: order.estimatedDeliveryTime,
                order: {
                    orderNumber: order.orderNumber,
                    _id: order._id,
                    total: order.total
                },
                // Build a status history for the timeline
                statusHistory: [
                    { status: 'assigned', timestamp: delivery.assignedAt || delivery.createdAt },
                    { status: 'picked_up', timestamp: delivery.pickedUpAt },
                    { status: 'delivered', timestamp: delivery.deliveredAt }
                ].filter(h => h.timestamp),
                deliveryAddress: order.deliveryAddress
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
