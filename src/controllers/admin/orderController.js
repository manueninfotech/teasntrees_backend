import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import Delivery from "../../models/Delivery.js";
import { riderAssignmentService } from "../../services/riderAssignmentService.js";
import { surgeService } from "../../services/surgeService.js";
import { getDistance } from "../../utils/geoUtils.js";
import { notificationService } from "../../services/notificationService.js";
import Settings from "../../models/Settings.js";
import logger from "../../config/logger.js";

// Get all orders with filters
export const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, customerId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.order === 'desc' ? -1 : 1;
        const skip = (page - 1) * limit;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (customerId) {
            query.customerId = customerId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!isNaN(start)) query.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!isNaN(end)) query.createdAt.$lte = end;
            }
        }

        const orders = await Order.find(query)
            .populate('customerId', 'name mobile email')
            .populate('items.product', 'name price image')
            .populate('riderId', 'name mobile')
            .sort({ [sortBy]: sortOrder })
            .limit(limit)
            .skip(skip);
        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
            pagination: {
                current: page,
                totalPages: Math.ceil(total / limit),
                limit: limit,
                totalItems: total
            }
        });
    } catch (error) {
        console.error('GetAllOrders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name mobile email address')
            .populate('items.product', 'name price image')
            .populate('riderId', 'name mobile');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        if (!paymentStatus || !['pending', 'paid', 'refunded'].includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        ).populate('customerId', 'name mobile email')
            .populate('items.product', 'name price image')
            .populate('riderId', 'name mobile');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out-for-delivery', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // --- NEW: Validation for Delivery Statuses ---
        const deliveryStatuses = ['assigned', 'picked_up', 'out-for-delivery', 'in_transit', 'delivered'];
        if (deliveryStatuses.includes(status) && !order.riderId) {
            return res.status(400).json({
                success: false,
                message: `Cannot set status to '${status}' without an assigned rider. Please assign a rider first.`
            });
        }

        order.status = status;
        // Update timestamps based on status
        if (status === 'confirmed') {
            order.confirmedAt = new Date();
        } else if (status === 'out-for-delivery') {
            order.outForDeliveryAt = new Date();
        } else if (status === 'delivered') {
            order.deliveredAt = new Date();

            // Update rider stats when delivery is completed
            if (order.riderId) {
                const rider = await User.findById(order.riderId);
                if (rider) {
                    // Set isOnDelivery to false
                    rider.isOnDelivery = false;

                    // Increment total deliveries
                    rider.totalDeliveries = (rider.totalDeliveries || 0) + 1;

                    // Calculate rider earning if not set
                    // Formula: Base Amount + (Order %) + (Distance × Rate)
                    if (!order.riderEarning) {
                        const settings = await Settings.findOne() || {};
                        const BASE_AMOUNT = settings.riderBaseEarning || 20;
                        const DISTANCE_RATE = settings.distanceBonusPerKm || 5;

                        // Calculate distance from outlet to delivery location
                        let distance = 2; // Default 2 km if location not available
                        const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 }; // Teas N Trees, Guntur

                        if (order.deliveryAddress?.location?.coordinates &&
                            Array.isArray(order.deliveryAddress.location.coordinates) &&
                            order.deliveryAddress.location.coordinates.length === 2) {

                            const deliveryCoords = order.deliveryAddress.location.coordinates;
                            const deliveryLng = Number(deliveryCoords[0]);
                            const deliveryLat = Number(deliveryCoords[1]);

                            // Validate coordinates are valid numbers
                            if (!isNaN(deliveryLat) && !isNaN(deliveryLng) &&
                                deliveryLat !== 0 && deliveryLng !== 0) {

                                // Calculate distance using Haversine formula (in km)
                                const R = 6371; // Earth's radius in km
                                const dLat = (deliveryLat - OUTLET_LOCATION.lat) * Math.PI / 180;
                                const dLng = (deliveryLng - OUTLET_LOCATION.lng) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos(OUTLET_LOCATION.lat * Math.PI / 180) * Math.cos(deliveryLat * Math.PI / 180) *
                                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const calc = R * c;

                                if (!isNaN(calc) && calc > 0) {
                                    distance = calc;
                                }
                            }
                        }

                        // Calculate total earning
                        const baseEarning = BASE_AMOUNT;
                        // Removed order percentage based on feedback
                        const distanceEarning = distance * DISTANCE_RATE;

                        const totalEarning = baseEarning + distanceEarning;
                        order.riderEarning = Math.max(Math.round(totalEarning), 20);

                        // Final validation to prevent NaN
                        if (isNaN(order.riderEarning)) {
                            order.riderEarning = 20;
                        }
                    }

                    // Update earnings
                    const earning = order.riderEarning || 0;
                    rider.totalEarnings = (rider.totalEarnings || 0) + earning;
                    rider.pendingEarnings = (rider.pendingEarnings || 0) + earning;

                    await rider.save();
                }
            }
        } else if (status === 'cancelled') {
            // Set rider's isOnDelivery to false if order was assigned
            if (order.riderId) {
                await User.findByIdAndUpdate(order.riderId, { isOnDelivery: false });
            }
        }
        await order.save();

        // --- NEW: Sync with Delivery Model ---
        try {
            const deliveryRelatedStatuses = ['assigned', 'picked_up', 'out-for-delivery', 'in_transit', 'delivered'];
            let delivery = await Delivery.findOne({ orderId: order._id });

            if (!delivery && deliveryRelatedStatuses.includes(status)) {
                // Create missing delivery record
                const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 };
                const settings = await Settings.findOne() || {};
                const baseFee = settings.riderBaseEarning || 20;
                const totalEarning = order.riderEarning || Math.max(Math.round(baseFee), 20);

                delivery = new Delivery({
                    orderId: order._id,
                    riderId: order.riderId,
                    customerId: order.customerId,
                    pickupLocation: {
                        type: 'Point',
                        coordinates: [OUTLET_LOCATION.lng, OUTLET_LOCATION.lat],
                        address: 'Teas N Trees Outlet'
                    },
                    deliveryLocation: order.deliveryAddress?.location || { type: 'Point', coordinates: [80.4308257, 16.3090716] },
                    distance: 2000,
                    baseEarning: baseFee,
                    totalEarning: totalEarning,
                    status: 'assigned',
                    assignedAt: new Date()
                });
            }

            if (delivery) {
                // Map Order status to Delivery status (some might be different)
                let deliveryStatus = status;

                if (['pending', 'confirmed', 'accepted', 'preparing', 'ready'].includes(status)) {
                    deliveryStatus = 'assigned';
                } else if (status === 'out-for-delivery') {
                    deliveryStatus = 'in_transit';
                }

                delivery.status = deliveryStatus;

                // Update timestamps in delivery record
                if (status === 'picked_up') delivery.pickedUpAt = new Date();
                if (status === 'out-for-delivery') delivery.pickedUpAt = delivery.pickedUpAt || new Date(); // Ensure pickedUpAt is set
                if (status === 'delivered') delivery.deliveredAt = new Date();
                if (status === 'cancelled') delivery.status = 'cancelled'; // Correct enum value

                await delivery.save();

                // Push Notification for Status Update
                try {
                    const customer = await User.findById(order.customerId);
                    if (customer) {
                        const statusLabels = {
                            'confirmed': 'Order Confirmed',
                            'preparing': 'Preparing your meal',
                            'ready': 'Ready for pickup',
                            'picked_up': 'Order picked up',
                            'in_transit': 'Out for delivery',
                            'delivered': 'Order Delivered'
                        };

                        await notificationService.sendPush(customer, {
                            title: statusLabels[status] || 'Order Update',
                            body: `Your Order #${order.orderNumber} is now ${statusLabels[status] || status}.`,
                            data: { orderId: order._id, status }
                        });
                    }
                } catch (pushErr) {
                    console.error('Failed to send status push:', pushErr);
                }
            }
        } catch (syncError) {
            console.error('Failed to sync delivery status:', syncError);
        }

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            // Notify customer
            socketService.notifyUser(order.customerId.toString(), 'order:status-updated', {
                orderId: order._id,
                status: order.status,
                estimatedDelivery: order.estimatedDeliveryTime
            });

            // Notify managers/admin
            socketService.notifyRole('manager', 'order:status-updated', {
                orderId: order._id,
                status: order.status,
                customerId: order.customerId
            });
            socketService.notifyRole('admin', 'order:status-updated', {
                orderId: order._id,
                status: order.status,
                customerId: order.customerId
            });
        }

        // --- AUTO-ASSIGNMENT LOGIC ---
        if (status === 'confirmed') {
            try {
                // Fixed Outlet Location (Guntur)
                const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 };

                // Get Customer Location from Order
                const customerLoc = order.deliveryAddress?.location?.coordinates; // [lng, lat]
                if (customerLoc) {
                    const deliveryLocation = { lng: customerLoc[0], lat: customerLoc[1] };

                    // Find Best Rider
                    const bestRider = await riderAssignmentService.findBestRider(deliveryLocation);

                    if (bestRider) {
                        // Calculate Distance for Record
                        const distMeters = getDistance(
                            OUTLET_LOCATION.lat, OUTLET_LOCATION.lng,
                            deliveryLocation.lat, deliveryLocation.lng
                        );

                        // Calculate Surge
                        const { multiplier, reason } = await surgeService.getSurgeMultiplier();
                        const settings = await Settings.findOne() || {};
                        const baseFee = settings.riderBaseEarning || 20;
                        const distanceRate = settings.distanceBonusPerKm || 5;

                        const distBonus = (distMeters / 1000) * distanceRate;
                        const surgeAmount = Math.round((baseFee + distBonus) * (multiplier - 1));
                        const totalEarning = Math.round((baseFee + distBonus) * multiplier);

                        // Create Delivery Record
                        const delivery = new Delivery({
                            orderId: order._id,
                            riderId: bestRider._id,
                            customerId: order.customerId,
                            pickupLocation: {
                                type: 'Point',
                                coordinates: [OUTLET_LOCATION.lng, OUTLET_LOCATION.lat],
                                address: 'Teas N Trees Outlet'
                            },
                            deliveryLocation: order.deliveryAddress.location,
                            distance: distMeters,
                            baseEarning: baseFee,
                            distanceBonus: distBonus,
                            surgeBonus: surgeAmount,
                            rejectionReason: reason !== 'Normal' ? `Surge: ${reason}` : undefined,
                            totalEarning: totalEarning,
                            status: 'assigned',
                            assignedAt: new Date(),
                            pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                            deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
                        });

                        await delivery.save();

                        // Notify Assigned Rider
                        if (socketService) {
                            socketService.notifyUser(bestRider._id.toString(), 'delivery:assigned', {
                                deliveryId: delivery._id,
                                orderId: order._id,
                                earning: delivery.totalEarning,
                                pickupAddress: 'Teas N Trees Outlet',
                                deliveryAddress: order.deliveryAddress.address
                            });
                            console.log(`[Auto-Assign] Assigned Order ${order.orderNumber} to ${bestRider.name}`);
                        }

                        // Push Notification to Rider
                        try {
                            await notificationService.sendPush(bestRider, {
                                title: 'New Delivery Assigned! 🛵',
                                body: `New order #${order.orderNumber} from Teas N Trees. Earn ₹${delivery.totalEarning}.`,
                                data: { type: 'delivery_assigned', deliveryId: delivery._id, orderId: order._id }
                            });
                        } catch (pErr) {
                            console.error('Auto-assign push failed:', pErr);
                        }
                    } else {
                        console.warn(`[Auto-Assign] No online riders found for Order ${order.orderNumber}`);
                        // Notify Admin of Failure
                        if (socketService) {
                            socketService.broadcastToRole('admin', 'alert:no-riders-available', {
                                orderId: order._id,
                                message: 'Order Confirmed but No Riders Available!'
                            });
                        }

                        // Push Notification to Admin (High Priority Alert)
                        try {
                            const admins = await User.find({ role: { $in: ['admin', 'manager'] } });
                            await notificationService.sendPushToMany(admins, {
                                title: '🚨 No Riders Available!',
                                body: `Order #${order.orderNumber} is confirmed but no online riders were found for auto-assignment.`,
                                data: { type: 'assignment_failure', orderId: order._id }
                            });
                        } catch (aPushErr) {
                            console.error('Failure alert push failed:', aPushErr);
                        }
                    }
                }
            } catch (assignError) {
                console.error('Auto-Assignment Failed:', assignError);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('UpdateOrderStatus Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

// Assign delivery rider to order
export const assignDeliveryRider = async (req, res) => {
    try {
        const { riderId, auto } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        let assignedRiderId = riderId;

        // Handle auto-assignment
        if (auto === true) {
            const customerLoc = order.deliveryAddress?.location?.coordinates;

            if (!customerLoc || !Array.isArray(customerLoc) || customerLoc.length !== 2) {
                logger.warn(`[Assign] Auto-assignment failed for Order ${order.orderNumber}: Customer location missing.`);
                return res.status(400).json({
                    success: false,
                    message: 'Cannot auto-assign: This order is missing GPS coordinates. Please assign a rider manually.'
                });
            }

            const deliveryLocation = { lng: customerLoc[0], lat: customerLoc[1] };

            // Find Best Rider using service (Location & Rating based)
            const bestRider = await riderAssignmentService.findBestRider(deliveryLocation);

            if (!bestRider) {
                logger.warn(`[Assign] Auto-assignment failed for Order ${order.orderNumber}: No suitable riders found.`);
                return res.status(400).json({
                    success: false,
                    message: 'No online riders found meeting the service criteria (Location, Rating, etc.). Please try manual assignment.'
                });
            }

            assignedRiderId = bestRider._id;
        }

        // Verify rider exists and has rider role
        const rider = await User.findById(assignedRiderId);
        if (!rider || rider.role !== 'rider') {
            return res.status(404).json({
                success: false,
                message: 'Rider not found or invalid rider'
            });
        }

        // Strict validation: Check if rider is active, approved, and online
        if (!rider.isActive) {
            return res.status(400).json({
                success: false,
                message: `Cannot assign order to ${rider.name}. Rider account is inactive. Please activate the rider first.`
            });
        }

        if (!rider.isApproved) {
            return res.status(400).json({
                success: false,
                message: `Cannot assign order to ${rider.name}. Rider is not approved yet. Please approve the rider first.`
            });
        }

        if (!rider.isOnline) {
            return res.status(400).json({
                success: false,
                message: `Cannot assign order to ${rider.name}. Rider is currently offline. Please wait for the rider to come online or select another rider.`
            });
        }

        // Update rider status to on delivery
        rider.isOnDelivery = true;
        await rider.save();

        order.riderId = assignedRiderId;
        order.status = 'out-for-delivery';
        order.dispatchedAt = new Date();
        order.outForDeliveryAt = new Date(); // Map to model field

        await order.save();

        // --- NEW: Create/Update Delivery Record ---
        try {
            // Outlet Location
            const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 }; // T&T Guntur

            // Get Customer Location
            const customerLoc = order.deliveryAddress?.location?.coordinates;
            const deliveryLocation = customerLoc ? { lng: customerLoc[0], lat: customerLoc[1] } : null;

            const orderId = order._id;
            const orderTotal = Number(order.total) || 0;
            console.log(`[Assign] Processing Delivery record for Order ${order.orderNumber}. ID: ${orderId}, Total: ${orderTotal}`);

            let delivery = await Delivery.findOne({ orderId: order._id });

            const distMeters = deliveryLocation ? getDistance(
                OUTLET_LOCATION.lat, OUTLET_LOCATION.lng,
                deliveryLocation.lat, deliveryLocation.lng
            ) : 2000; // Default 2km

            // Calculate estimated travel time (in minutes)
            // Rule: 10 mins base + 3 mins per km
            const estimatedTravelTime = Math.round(10 + (distMeters / 1000) * 3);

            const settings = await Settings.findOne() || {};
            const baseFee = settings.riderBaseEarning || 20;
            const distanceRate = settings.distanceBonusPerKm || 5;

            const distBonus = (distMeters / 1000) * distanceRate;
            const totalEarning = Math.round(baseFee + distBonus);
            console.log(`[Assign] Calculated Earning: ${totalEarning} (Base: ${baseFee}, DistBonus: ${distBonus.toFixed(2)}). Est Time: ${estimatedTravelTime}m`);

            if (!delivery) {
                delivery = new Delivery({
                    orderId: order._id,
                    riderId: assignedRiderId,
                    customerId: order.customerId,
                    pickupLocation: {
                        type: 'Point',
                        coordinates: [OUTLET_LOCATION.lng, OUTLET_LOCATION.lat],
                        address: 'Teas N Trees Outlet'
                    },
                    deliveryLocation: {
                        type: 'Point',
                        coordinates: order.deliveryAddress.location.coordinates,
                        address: order.deliveryAddress.address
                    },
                    distance: distMeters,
                    estimatedTime: estimatedTravelTime, // Set the estimated time
                    baseEarning: baseFee,
                    distanceBonus: distBonus,
                    totalEarning: totalEarning,
                    status: 'in_transit',
                    assignedAt: new Date(),
                    pickedUpAt: new Date(),
                    pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                    deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
                });
            } else {
                delivery.riderId = assignedRiderId;
                delivery.status = 'in_transit';
                delivery.deliveryLocation = {
                    type: 'Point',
                    coordinates: order.deliveryAddress.location.coordinates,
                    address: order.deliveryAddress.address
                };
                delivery.distance = distMeters;
                delivery.estimatedTime = estimatedTravelTime; // Update the estimated time
                delivery.assignedAt = delivery.assignedAt || new Date();
                delivery.pickedUpAt = delivery.pickedUpAt || new Date();
                delivery.totalEarning = totalEarning;
            }

            await delivery.save();
        } catch (deliveryError) {
            console.error('Failed to create/update delivery record:', deliveryError);
        }

        const updatedOrder = await Order.findById(order._id)
            .populate('riderId', 'name mobile');

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            // Notify the assigned rider
            socketService.notifyUser(assignedRiderId.toString(), 'delivery:assigned', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                deliveryAddress: order.deliveryAddress
            });

            // Notify customer
            socketService.notifyUser(order.customerId.toString(), 'order:rider-assigned', {
                orderId: order._id,
                riderName: rider.name,
                riderMobile: rider.mobile
            });

            // Notify managers/admin
            socketService.notifyRole('manager', 'delivery:assigned', {
                orderId: order._id,
                riderId: assignedRiderId,
                riderName: rider.name
            });
        }

        // Push Notification to Rider (Manual Assignment)
        try {
            await notificationService.sendPush(rider, {
                title: 'New Delivery Assigned! ',
                body: `You have been assigned order #${order.orderNumber}. Tap to view details.`,
                data: { type: 'delivery_assigned', orderId: order._id }
            });
        } catch (mPushErr) {
            console.error('Manual assign push failed:', mPushErr);
        }

        res.status(200).json({
            success: true,
            message: 'Rider assigned successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Error in assignDeliveryRider:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning rider to order',
            error: error.message
        });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel delivered order'
            });
        }

        order.status = 'cancelled';
        order.cancelReason = reason || 'Cancelled by admin';
        order.cancelledAt = new Date();

        await order.save();

        // Emit Socket.io event
        const socketService = req.app.get('socketService');
        if (socketService) {
            // Notify customer
            socketService.notifyUser(order.customerId.toString(), 'order:cancelled', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                reason: order.cancelReason
            });

            // Notify rider if assigned
            if (order.riderId) {
                socketService.notifyUser(order.riderId.toString(), 'order:cancelled', {
                    orderId: order._id,
                    orderNumber: order.orderNumber
                });
            }

            // Notify managers/admin
            socketService.notifyRole('manager', 'order:cancelled', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                customerId: order.customerId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};
// Get order statistics

export const getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        // In-progress orders (confirmed, preparing, ready, assigned, picked_up, out-for-delivery, in_transit)
        const inProgressOrders = await Order.countDocuments({
            status: { $in: ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out-for-delivery', 'in_transit'] }
        });

        // Calculate total revenue from delivered orders with paid payment status
        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered', paymentStatus: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Today's orders and revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // Today's revenue from delivered orders with paid payment status
        const todayRevenueData = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    paymentStatus: 'paid',
                    deliveredAt: { $gte: today }
                }
            },
            { $group: { _id: null, todayRevenue: { $sum: '$total' } } }
        ]);

        const todayRevenue = todayRevenueData.length > 0 ? todayRevenueData[0].todayRevenue : 0;

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                confirmedOrders,
                inProgressOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                todayRevenue,
                todayOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order stats',
            error: error.message
        });
    }
};
