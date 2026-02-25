import mongoose from "mongoose";
import Rider from "../models/Rider.js";
import Delivery from "../models/Delivery.js";
import { getDistance } from "../utils/geoUtils.js";
import logger from "../config/logger.js";

class RiderAssignmentService {
    CONFIG = {
        MAX_ASSIGNMENT_DISTANCE: 15000, // 15KM hard limit
        SEARCH_RADIUS: 10000,
        AUTO_ASSIGN_TIMEOUT: 30000 // 30s rider response window
    };

    /* ======================================================
       FIND BEST RIDER (NO LOCKING HERE)
    ====================================================== */
    async findBestRider(customerLocation, outletLocation, excludeRiderIds = []) {
        try {
            const query = {
                isOnline: true,
                isOnDelivery: false,
                isApproved: true,
                isActive: true
            };

            if (excludeRiderIds.length > 0) {
                query._id = { $nin: excludeRiderIds };
            }

            if (outletLocation && outletLocation.lat && outletLocation.lng) {
                query.currentLocation = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [outletLocation.lng, outletLocation.lat]
                        },
                        $maxDistance: this.CONFIG.MAX_ASSIGNMENT_DISTANCE
                    }
                };
            }

            const riders = await Rider.find(query)
                .select("name currentLocation vehicleType averageRating totalDeliveries")
                .limit(20) // Process at most top 20 nearest riders
                .lean();

            if (!riders.length) {
                logger.warn("[RiderAssignment] No riders available nearby");
                return null;
            }

            const fallbackOutletLocation = outletLocation || { lat: 16.3090716, lng: 80.4308257 };

            const scored = riders
                .map(rider => {
                    if (!rider.currentLocation?.coordinates) {
                        return { rider, score: -1 };
                    }

                    const score = this.calculateRiderScore(
                        rider,
                        customerLocation,
                        fallbackOutletLocation
                    );

                    return { rider, score };
                })
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score);

            return scored.length ? scored[0].rider : null;

        } catch (err) {
            logger.error("[RiderAssignment] findBestRider error", err);
            return null;
        }
    }

    /* ======================================================
       ATOMIC LOCK (ON ACCEPTANCE)
    ====================================================== */
    async atomicLockRider(riderId) {
        return Rider.findOneAndUpdate(
            { _id: riderId, isOnDelivery: false },
            { isOnDelivery: true, lastAssignedAt: new Date() },
            { new: true }
        );
    }

    async unlockRider(riderId) {
        await Rider.findByIdAndUpdate(riderId, { isOnDelivery: false });
    }

    /* ======================================================
       SCORING LOGIC
    ====================================================== */
    calculateRiderScore(rider, customerLocation, outletLocation) {
        let score = 100;

        const riderLat = rider.currentLocation.coordinates[1];
        const riderLng = rider.currentLocation.coordinates[0];

        const distToOutlet = getDistance(
            riderLat,
            riderLng,
            outletLocation.lat,
            outletLocation.lng
        );
        score -= (distToOutlet / 1000) * 5;

        if (customerLocation?.lat && customerLocation?.lng) {
            const distToCustomer = getDistance(
                riderLat,
                riderLng,
                customerLocation.lat,
                customerLocation.lng
            );
            score -= (distToCustomer / 1000);
        }

        if (rider.averageRating > 4) {
            score += (rider.averageRating - 4) * 20;
        }

        score += Math.min((rider.totalDeliveries || 0) / 100, 10);

        return Math.max(score, 1);
    }

    /* ======================================================
       ASSIGN RIDER WITH RETRY
    ====================================================== */
    async assignRiderWithRetry(order, io, deliveryData) {
        const excludedRiders = [];
        let attempts = 0;

        const coords = deliveryData.deliveryLocation?.coordinates;
        const customerLocation = coords
            ? { lat: coords[1], lng: coords[0] }
            : null;

        const outletLocation = order.pickupLocation?.coordinates ? {
            lat: order.pickupLocation.coordinates[1],
            lng: order.pickupLocation.coordinates[0]
        } : { lat: 16.3090716, lng: 80.4308257 }; // Fallback central location

        while (attempts < 5) {
            attempts++;

            const rider = await this.findBestRider(customerLocation, outletLocation, excludedRiders);
            if (!rider) break;

            try {
                const delivery = await Delivery.create({
                    ...deliveryData,
                    brand: deliveryData.brand || order.brand || "teasntrees",
                    riderId: rider._id,
                    status: "pending_acceptance",
                    assignedAt: new Date()
                });

                // Lock rider
                await Rider.findByIdAndUpdate(rider._id, { isOnDelivery: true });

                if (io) {
                    io.to(`user:${rider._id}`).emit("delivery:assigned", {
                        deliveryId: delivery._id,
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        earning: delivery.totalEarning,
                        timeout: 30
                    });

                    io.to("role:admin").to("role:manager").emit("rider:assigned", {
                        orderId: order._id,
                        riderId: rider._id,
                        deliveryId: delivery._id
                    });
                }

                logger.info(`[RiderAssignment] Rider ${rider.name} assigned to order ${order.orderNumber}`);

                return {
                    success: true,
                    delivery,
                    rider,
                    reason: "Rider assigned (awaiting acceptance)"
                };

            } catch (err) {
                logger.error("[RiderAssignment] Assignment error", err);
                excludedRiders.push(rider._id);
                await this.unlockRider(rider._id);
            }
        }

        if (io) {
            io.to("role:admin").to("role:manager").emit("rider:assignment-failed", {
                orderId: order._id,
                orderNumber: order.orderNumber
            });
        }

        return {
            success: false,
            delivery: null,
            rider: null,
            reason: "No riders available"
        };
    }

    /* ======================================================
       CREATE OR UPDATE DELIVERY (MANUAL ASSIGNMENT)
    ====================================================== */
    async createOrUpdateDelivery(order, rider) {
        try {
            // 1. Atomic lock: Set rider as busy
            await Rider.findByIdAndUpdate(rider._id, { isOnDelivery: true });

            // 2. Find or Create Delivery
            let delivery = await Delivery.findOne({ orderId: order._id });

            if (delivery) {
                if (['delivered', 'cancelled'].includes(delivery.status)) {
                    throw new Error('Cannot reassign rider for a terminal delivery');
                }
                delivery.riderId = rider._id;
                delivery.brand = order.brand || delivery.brand || 'teasntrees';
                delivery.status = 'pending_acceptance';
                delivery.assignedAt = new Date();
                await delivery.save();
                return delivery;
            }

            const outletLocation = order.pickupLocation?.coordinates ? {
                lat: order.pickupLocation.coordinates[1],
                lng: order.pickupLocation.coordinates[0]
            } : { lat: 16.3090716, lng: 80.4308257 };

            const deliveryLocation = order.deliveryAddress?.location;

            if (!deliveryLocation?.coordinates) {
                throw new Error('Order has no delivery coordinates');
            }

            const distance = getDistance(
                outletLocation.lat,
                outletLocation.lng,
                deliveryLocation.coordinates[1],
                deliveryLocation.coordinates[0]
            );

            const deliveryData = {
                orderId: order._id,
                brand: order.brand || 'teasntrees',
                riderId: rider._id,
                customerId: order.customerId,
                pickupLocation: {
                    type: 'Point',
                    coordinates: [outletLocation.lng, outletLocation.lat],
                    address: 'Pickup Outlet'
                },
                deliveryLocation,
                distance,
                baseEarning: order.riderEarning || 20,
                totalEarning: order.riderEarning || 20,
                status: 'pending_acceptance',
                assignedAt: new Date(),
                pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
            };

            delivery = await Delivery.create(deliveryData);
            return delivery;

        } catch (err) {
            logger.error(`[RiderAssignment] createOrUpdateDelivery failed: ${err.message}`);
            await this.unlockRider(rider._id);
            throw err;
        }
    }

    /* ======================================================
       PROCESS WAITING ORDERS (BACKGROUND / TRIGGERED)
    ====================================================== */
    async processWaitingOrders(io) {
        try {
            const Order = mongoose.model('Order');
            const pendingOrders = await Order.find({
                status: 'waiting_for_rider',
                riderId: { $exists: false }
            }).limit(10); // Batch process

            if (!pendingOrders.length) return;

            logger.info(`[RiderAssignment] Scanning ${pendingOrders.length} waiting orders...`);

            const Settings = mongoose.model('Settings');

            for (const order of pendingOrders) {
                const settings = (await Settings.findOne({ brand: order.brand || 'teasntrees' })) || {};
                const base = settings.riderBaseEarning || 20;
                const rate = settings.distanceBonusPerKm || 5;

                const coords = order.deliveryAddress?.location?.coordinates;
                if (!coords || coords.length !== 2) continue;

                const outletLocation = order.pickupLocation?.coordinates ? {
                    lat: order.pickupLocation.coordinates[1],
                    lng: order.pickupLocation.coordinates[0]
                } : { lat: 16.3090716, lng: 80.4308257 };

                const distance = getDistance(
                    outletLocation.lat,
                    outletLocation.lng,
                    coords[1],
                    coords[0]
                );

                await this.assignRiderWithRetry(
                    order,
                    io,
                    {
                        orderId: order._id,
                        brand: order.brand || 'teasntrees',
                        customerId: order.customerId,
                        pickupLocation: {
                            type: 'Point',
                            coordinates: [outletLocation.lng, outletLocation.lat],
                            address: 'Pickup Outlet'
                        },
                        deliveryLocation: order.deliveryAddress.location,
                        distance,
                        baseEarning: base,
                        totalEarning: Math.round(base + (distance / 1000) * rate),
                        pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                        deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
                    }
                );
            }
        } catch (err) {
            logger.error("[RiderAssignment] processWaitingOrders failed:", err);
        }
    }

    /* ======================================================
       SYNC RIDER STATUS (SELF-HEALING)
    ====================================================== */
    async syncRiderStatus(riderId) {
        try {
            const Rider = mongoose.model('Rider');
            const Delivery = mongoose.model('Delivery');

            const activeDelivery = await Delivery.findOne({
                riderId,
                status: { $nin: ['delivered', 'cancelled', 'rejected'] }
            });

            const shouldBeOnDelivery = !!activeDelivery;

            await Rider.findByIdAndUpdate(riderId, {
                isOnDelivery: shouldBeOnDelivery
            });

            logger.info(`[RiderSync] Synced rider ${riderId}. isOnDelivery: ${shouldBeOnDelivery}`);
            return shouldBeOnDelivery;
        } catch (err) {
            logger.error(`[RiderSync] Failed to sync rider ${riderId}: ${err.message}`);
            return false;
        }
    }
}

export const riderAssignmentService = new RiderAssignmentService();
