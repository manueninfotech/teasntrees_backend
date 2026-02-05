/*import Rider from "../models/Rider.js";
import Delivery from "../models/Delivery.js";
import { getDistance } from "../utils/geoUtils.js";
import logger from "../config/logger.js";

class RiderAssignmentService {
    CONFIG = {
        MAX_ASSIGNMENT_DISTANCE: 15000, // 15KM max pickup distance (HARD LIMIT)
        SEARCH_RADIUS: 10000,
        AUTO_ASSIGN_TIMEOUT: 30000 // 30 seconds for rider to accept
    };

    /**
     * Find best rider for an order with atomic locking
     * @param {Object} customerLocation - { lat, lng }
     * @param {Array} excludeRiderIds - Rider IDs to exclude (already tried)
     * @returns {Object|null} - Locked rider or null
     */
/*  async findBestRider(customerLocation, excludeRiderIds = []) {
      try {
          const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 };

          // Get all available riders (excluding already tried ones)
          const query = {
              isOnline: true,
              isOnDelivery: false,
              isApproved: true,
              isActive: true
          };

          if (excludeRiderIds.length > 0) {
              query._id = { $nin: excludeRiderIds };
          }

          const onlineRiders = await Rider.find(query)
              .select('name currentLocation vehicleType averageRating totalDeliveries')
              .lean();

          logger.info(`[RiderAssignment] Found ${onlineRiders.length} available riders (excluded: ${excludeRiderIds.length})`);

          if (onlineRiders.length === 0) {
              logger.warn('[RiderAssignment] No online riders available');
              return null;
          }

          // Score and filter riders
          const scoredRiders = onlineRiders
              .map(rider => {
                  if (!rider.currentLocation || !rider.currentLocation.coordinates) {
                      logger.debug(`[RiderAssignment] Rider ${rider.name} skipped: Missing location`);
                      return { rider, score: -1, distToOutlet: Infinity };
                  }

                  const riderLat = rider.currentLocation.coordinates[1];
                  const riderLng = rider.currentLocation.coordinates[0];

                  logger.debug(`[RiderAssignment] Rider ${rider.name} location: [${riderLng}, ${riderLat}]`);
                  logger.debug(`[RiderAssignment] Outlet location: [${OUTLET_LOCATION.lng}, ${OUTLET_LOCATION.lat}]`);

                  const distToOutlet = getDistance(riderLat, riderLng, OUTLET_LOCATION.lat, OUTLET_LOCATION.lng);

                  logger.debug(`[RiderAssignment] Calculated distance: ${distToOutlet}m`);

                  // HARD DISTANCE ENFORCEMENT: Exclude riders beyond MAX_ASSIGNMENT_DISTANCE
                  if (distToOutlet > this.CONFIG.MAX_ASSIGNMENT_DISTANCE) {
                      logger.debug(`[RiderAssignment] Rider ${rider.name} excluded: ${(distToOutlet / 1000).toFixed(2)}km > ${this.CONFIG.MAX_ASSIGNMENT_DISTANCE / 1000}km`);
                      return { rider, score: -1, distToOutlet };
                  }

                  const score = this.calculateRiderScore(rider, customerLocation, OUTLET_LOCATION);
                  logger.info(`[RiderAssignment] Scored Rider: ${rider.name}, Score: ${score.toFixed(2)}, Dist to Outlet: ${(distToOutlet / 1000).toFixed(2)}km`);

                  return { rider, score, distToOutlet };
              })
              .filter(r => r.score > 0) // Remove excluded riders
              .sort((a, b) => b.score - a.score); // Sort by score descending

          if (scoredRiders.length === 0) {
              logger.warn('[RiderAssignment] No eligible riders within distance limit');
              return null;
          }

          // Return best rider WITHOUT locking (locking happens on acceptance)
          const bestRider = scoredRiders[0];
          logger.info(`[RiderAssignment] Best rider found: ${bestRider.rider.name} (score: ${bestRider.score.toFixed(2)})`);

          return bestRider.rider;

      } catch (error) {
          logger.error('[RiderAssignment] Error finding best rider:', error);
          return null;
      }
  }

  /**
   * Atomically lock a rider to prevent race conditions
   * @param {String} riderId - Rider ID to lock
   * @returns {Object|null} - Locked rider document or null if already locked
   */
/* async atomicLockRider(riderId) {
     try {
         // Atomic operation: only update if isOnDelivery is false
         const lockedRider = await Rider.findOneAndUpdate(
             {
                 _id: riderId,
                 isOnDelivery: false // Condition: must be available
             },
             {
                 isOnDelivery: true, // Update: mark as busy
                 lastAssignedAt: new Date()
             },
             {
                 new: true, // Return updated document
                 select: 'name mobile currentLocation vehicleType'
             }
         );

         if (!lockedRider) {
             logger.debug(`[RiderAssignment] Rider ${riderId} already locked by another order`);
             return null;
         }

         logger.info(`[RiderAssignment] Atomically locked rider: ${lockedRider.name}`);
         return lockedRider;

     } catch (error) {
         logger.error(`[RiderAssignment] Error locking rider ${riderId}:`, error);
         return null;
     }
 }

 /**
  * Unlock a rider (if assignment fails or is rejected)
  * @param {String} riderId - Rider ID to unlock
  */
/*  async unlockRider(riderId) {
      try {
          await Rider.findByIdAndUpdate(riderId, { isOnDelivery: false });
          logger.info(`[RiderAssignment] Unlocked rider: ${riderId}`);
      } catch (error) {
          logger.error(`[RiderAssignment] Error unlocking rider ${riderId}:`, error);
      }
  }

  /**
   * Calculate rider score (0-100)
   * Higher score = better candidate
   */
/* calculateRiderScore(rider, customerLocation, outletLocation) {
     let score = 100;
     const riderLat = rider.currentLocation.coordinates[1];
     const riderLng = rider.currentLocation.coordinates[0];

     logger.debug(`[RiderAssignment] Scoring rider ${rider.name}`);
     logger.debug(`[RiderAssignment] Customer location:`, JSON.stringify(customerLocation));
     logger.debug(`[RiderAssignment] Rider stats: rating=${rider.averageRating}, deliveries=${rider.totalDeliveries}`);

     // Distance from outlet (primary factor)
     const distToOutlet = getDistance(riderLat, riderLng, outletLocation.lat, outletLocation.lng);
     score -= (distToOutlet / 1000) * 5; // -5 points per km from outlet

     // Distance from customer (secondary factor)
     if (customerLocation && customerLocation.lat && customerLocation.lng) {
         const distToCustomer = getDistance(riderLat, riderLng, customerLocation.lat, customerLocation.lng);
         score -= (distToCustomer / 1000) * 1; // -1 point per km from customer
     } else {
         logger.warn(`[RiderAssignment] Invalid customer location for scoring: ${JSON.stringify(customerLocation)}`);
     }

     // Rating bonus (up to +20 points)
     if (rider.averageRating && rider.averageRating > 4.0) {
         score += (rider.averageRating - 4.0) * 20;
     }

     // Experience bonus (up to +10 points)
     score += Math.min((rider.totalDeliveries || 0) / 100, 10);

     logger.debug(`[RiderAssignment] Final score for ${rider.name}: ${score}`);

     return Math.max(score, 1); // Minimum score of 1
 }

 /**
  * Assign rider with retry logic and timeout handling
  * @param {Object} order - Order document
  * @param {Object} io - Socket.io instance
  * @param {Object} deliveryData - Delivery creation data
  * @returns {Object} - { success, delivery, rider, reason }
  */
/* async assignRiderWithRetry(order, io, deliveryData) {
     const maxRetries = 5; // Try up to 5 different riders
     const excludedRiders = [];
     let attempt = 0;

     logger.info(`[RiderAssignment] Starting assignment for order ${order.orderNumber}`);

     // Emit assignment started event
     if (io) {
         io.to('role:admin').to('role:manager').emit('rider:assignment-started', {
             orderId: order._id,
             orderNumber: order.orderNumber,
             timestamp: new Date()
         });
     }

     while (attempt < maxRetries) {
         attempt++;
         logger.info(`[RiderAssignment] Attempt ${attempt}/${maxRetries}`);

         // Find and lock best available rider
         const rider = await this.findBestRider(deliveryData.deliveryLocation, excludedRiders);

         if (!rider) {
             logger.warn(`[RiderAssignment] No riders available (attempt ${attempt})`);
             break; // No more riders to try
         }

         try {
             // Create delivery record with status 'assigned' (rider NOT locked yet)
             // Rider will be locked when they accept via rider/deliveryController
             const delivery = new Delivery({
                 ...deliveryData,
                 riderId: rider._id,
                 status: 'assigned', // Waiting for rider acceptance
                 assignedAt: new Date()
             });

             await delivery.save();
             logger.info(`[RiderAssignment] Delivery created: ${delivery._id} (waiting for rider acceptance)`);

             // Emit rider assigned event
             if (io) {
                 const assignmentData = {
                     orderId: order._id,
                     orderNumber: order.orderNumber,
                     riderId: rider._id,
                     riderName: rider.name,
                     deliveryId: delivery._id,
                     earning: delivery.totalEarning,
                     timestamp: new Date()
                 };

                 // Notify rider - they need to accept/reject within 30s
                 io.to(`user:${rider._id}`).emit('delivery:assigned', {
                     deliveryId: delivery._id,
                     orderId: order._id,
                     orderNumber: order.orderNumber,
                     earning: delivery.totalEarning,
                     pickupAddress: deliveryData.pickupLocation.address,
                     deliveryAddress: deliveryData.deliveryLocation.address,
                     distance: (deliveryData.distance / 1000).toFixed(2) + ' km',
                     timeout: 30 // 30 seconds to accept
                 });

                 // Notify admin/managers
                 io.to('role:admin').to('role:manager').emit('rider:assigned', assignmentData);
             }

             logger.info(`[RiderAssignment] Successfully assigned rider ${rider.name} to order ${order.orderNumber} (pending acceptance)`);

             return {
                 success: true,
                 delivery,
                 rider,
                 reason: 'Rider assigned successfully (pending acceptance)'
             };

         } catch (error) {
             logger.error(`[RiderAssignment] Error creating delivery for rider ${rider.name}:`, error);

             // Unlock rider if delivery creation failed
             await this.unlockRider(rider._id);
             excludedRiders.push(rider._id);

             // Continue to next rider
             continue;
         }
     }

     // All attempts failed
     logger.error(`[RiderAssignment] Failed to assign rider after ${attempt} attempts`);

     // Emit assignment failed event
     if (io) {
         io.to('role:admin').to('role:manager').emit('rider:assignment-failed', {
             orderId: order._id,
             orderNumber: order.orderNumber,
             reason: excludedRiders.length === 0 ? 'No riders available' : 'All riders unavailable',
             timestamp: new Date()
         });
     }

     return {
         success: false,
         delivery: null,
         rider: null,
         reason: excludedRiders.length === 0 ? 'No riders available' : 'All eligible riders are busy'
     };
 }
}

export const riderAssignmentService = new RiderAssignmentService();
*/


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
    async findBestRider(customerLocation, excludeRiderIds = []) {
        try {
            const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 };

            const query = {
                isOnline: true,
                isOnDelivery: false,
                isApproved: true,
                isActive: true
            };

            if (excludeRiderIds.length > 0) {
                query._id = { $nin: excludeRiderIds };
            }

            const riders = await Rider.find(query)
                .select("name currentLocation vehicleType averageRating totalDeliveries")
                .lean();

            if (!riders.length) {
                logger.warn("[RiderAssignment] No riders available");
                return null;
            }

            const scored = riders
                .map(rider => {
                    if (!rider.currentLocation?.coordinates) {
                        return { rider, score: -1 };
                    }

                    const riderLat = rider.currentLocation.coordinates[1];
                    const riderLng = rider.currentLocation.coordinates[0];

                    const distToOutlet = getDistance(
                        riderLat,
                        riderLng,
                        OUTLET_LOCATION.lat,
                        OUTLET_LOCATION.lng
                    );

                    if (distToOutlet > this.CONFIG.MAX_ASSIGNMENT_DISTANCE) {
                        return { rider, score: -1 };
                    }

                    const score = this.calculateRiderScore(
                        rider,
                        customerLocation,
                        OUTLET_LOCATION
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

        while (attempts < 5) {
            attempts++;

            const rider = await this.findBestRider(customerLocation, excludedRiders);
            if (!rider) break;

            try {
                const delivery = await Delivery.create({
                    ...deliveryData,
                    riderId: rider._id,
                    status: "assigned",
                    assignedAt: new Date()
                });

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

        /* ❌ NO RIDERS AVAILABLE */
        order.status = "waiting_for_rider";
        await order.save();

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
                delivery.status = 'assigned';
                delivery.assignedAt = new Date();
                await delivery.save();
                return delivery;
            }

            const OUTLET = { lat: 16.3090716, lng: 80.4308257 };
            const deliveryLocation = order.deliveryAddress?.location;

            if (!deliveryLocation?.coordinates) {
                throw new Error('Order has no delivery coordinates');
            }

            const distance = getDistance(
                OUTLET.lat,
                OUTLET.lng,
                deliveryLocation.coordinates[1],
                deliveryLocation.coordinates[0]
            );

            const deliveryData = {
                orderId: order._id,
                riderId: rider._id,
                customerId: order.customerId,
                pickupLocation: {
                    type: 'Point',
                    coordinates: [OUTLET.lng, OUTLET.lat],
                    address: 'Teas N Trees Outlet'
                },
                deliveryLocation,
                distance,
                baseEarning: order.riderEarning || 20,
                totalEarning: order.riderEarning || 20,
                status: 'assigned',
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
