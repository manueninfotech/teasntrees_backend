import mongoose from "mongoose";
import Rider from "../models/Rider.js";
import { getDistance } from "../utils/geoUtils.js";
import logger from "../config/logger.js";

const BRAND_OUTLETS = {
    littleh: {
        name: 'LittleH Bakery (Amaravathi Road)',
        coordinates: [80.4309655, 16.3090654], // [lng, lat]
        lat: 16.3090654,
        lng: 80.4309655
    },
    teasntrees: {
        name: 'Teas N Trees (Lakshmipuram)',
        coordinates: [80.4187407, 16.314207], // [lng, lat]
        lat: 16.314207,
        lng: 80.4187407
    }
};


class RiderAssignmentService {
    CONFIG = {
        MAX_ASSIGNMENT_DISTANCE: 15000, // 15KM hard limit
        SEARCH_RADIUS: 10000,
        AUTO_ASSIGN_TIMEOUT: 30000 // 30s rider response window
    };

    io = null;

    setIo(io) {
        this.io = io;
    }

    emitRiderStatus(riderId, statusData) {
        if (this.io) {
            this.io.emit('rider:status-updated', {
                riderId,
                ...statusData,
                timestamp: new Date()
            });
        }
    }

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

            const defaultCoords = BRAND_OUTLETS.teasntrees; // Default fallback to original
            const fallbackOutletLocation = outletLocation || { lat: defaultCoords.lat, lng: defaultCoords.lng };

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

        const defaultOutlet = BRAND_OUTLETS[order.brand] || BRAND_OUTLETS.teasntrees;
        const outletLocation = order.pickupLocation?.coordinates ? {
            lat: order.pickupLocation.coordinates[1],
            lng: order.pickupLocation.coordinates[0]
        } : { lat: defaultOutlet.lat, lng: defaultOutlet.lng };

        while (attempts < 5) {
            attempts++;

            const rider = await this.findBestRider(customerLocation, outletLocation, excludedRiders);
            if (!rider) break;

            try {
                const DeliveryModel = mongoose.model('Delivery');
                const delivery = await DeliveryModel.create({
                    ...deliveryData,
                    brand: order.brand || deliveryData.brand || "teasntrees",
                    riderId: rider._id,
                    status: "pending_acceptance",
                    assignedAt: new Date(),
                    deliveryLocation: {
                        ...deliveryData.deliveryLocation,
                        address: order.deliveryAddress?.address || 'Customer Address'
                    },
                    pickupLocation: {
                        ...deliveryData.pickupLocation,
                        address: BRAND_OUTLETS[order.brand]?.name || 'Outlet'
                    }
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

            const DeliveryModel = mongoose.model('Delivery');
            // 2. Find or Create Delivery
            let delivery = await DeliveryModel.findOne({ orderId: order._id });

            if (delivery) {
                if (['delivered', 'cancelled'].includes(delivery.status)) {
                    throw new Error('Cannot reassign rider for a terminal delivery');
                }
                delivery.riderId = rider._id;
                delivery.brand = order.brand || delivery.brand;
                delivery.status = 'pending_acceptance';
                delivery.assignedAt = new Date();
                await delivery.save();
                return delivery;
            }

            const defaultOutlet = BRAND_OUTLETS[order.brand] || BRAND_OUTLETS.teasntrees;
            const outletLocation = order.pickupLocation?.coordinates ? {
                lat: order.pickupLocation.coordinates[1],
                lng: order.pickupLocation.coordinates[0]
            } : { lat: defaultOutlet.lat, lng: defaultOutlet.lng };

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
                brand: order.brand,
                riderId: rider._id,
                customerId: order.customerId,
                pickupLocation: {
                    type: 'Point',
                    coordinates: [outletLocation.lng, outletLocation.lat],
                    address: BRAND_OUTLETS[order.brand]?.name || 'Outlet'
                },
                deliveryLocation: {
                    ...deliveryLocation,
                    address: order.deliveryAddress?.address || 'Customer Address'
                },
                distance,
                baseEarning: order.riderEarning || 20,
                totalEarning: order.riderEarning || 20,
                status: 'pending_acceptance',
                assignedAt: new Date(),
                pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
                deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString()
            };

            delivery = await DeliveryModel.create(deliveryData);
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
                const settings = (await Settings.findOne({ brand: order.brand })) || {};
                const base = settings.riderBaseEarning || 20;
                const rate = settings.distanceBonusPerKm || 5;

                const coords = order.deliveryAddress?.location?.coordinates;
                if (!coords || coords.length !== 2) continue;

                const defaultOutlet = BRAND_OUTLETS[order.brand] || BRAND_OUTLETS.teasntrees;
                const outletLocation = order.pickupLocation?.coordinates ? {
                    lat: order.pickupLocation.coordinates[1],
                    lng: order.pickupLocation.coordinates[0]
                } : { lat: defaultOutlet.lat, lng: defaultOutlet.lng };

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
                        brand: order.brand,
                        customerId: order.customerId,
                        pickupLocation: {
                            type: 'Point',
                            coordinates: [outletLocation.lng, outletLocation.lat],
                            address: BRAND_OUTLETS[order.brand]?.name || 'Outlet'
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
            const [activeDelivery, rider] = await Promise.all([
                mongoose.model('Delivery').findOne({
                    riderId,
                    status: { $nin: ['delivered', 'cancelled', 'rejected'] }
                }),
                Rider.findById(riderId).select('isOnDelivery')
            ]);

            const shouldBeOnDelivery = !!activeDelivery;

            if (rider && rider.isOnDelivery !== shouldBeOnDelivery) {
                await Rider.findByIdAndUpdate(riderId, {
                    isOnDelivery: shouldBeOnDelivery
                });
                this.emitRiderStatus(riderId, { isOnDelivery: shouldBeOnDelivery, isBusy: shouldBeOnDelivery });
                logger.info(`[RiderSync] Status repaired for rider ${riderId}. New isOnDelivery: ${shouldBeOnDelivery}`);
            }

            return shouldBeOnDelivery;
        } catch (err) {
            logger.error(`[RiderSync] Failed to sync rider ${riderId}: ${err.message}`);
            return false;
        }
    }
}

export const riderAssignmentService = new RiderAssignmentService();
