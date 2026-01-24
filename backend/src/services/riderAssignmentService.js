import Rider from "../models/Rider.js";
import { getDistance } from "../utils/geoUtils.js";
import logger from "../config/logger.js";

class RiderAssignmentService {
    CONFIG = {
        MAX_ASSIGNMENT_DISTANCE: 15000, // 15KM max pickup distance
        SEARCH_RADIUS: 10000,
        AUTO_ASSIGN_TIMEOUT: 30000
    };
    // Find best rider for an order
    async findBestRider(customerLocation) {
        try {
            // update the coordinates to your outlet location
            const OUTLET_LOCATION = { lat: 16.3090716, lng: 80.4308257 };
            // get all available riders
            const onlineRiders = await Rider.find({
                isOnline: true,
                isOnDelivery: false,
                isApproved: true,
                isActive: true
            }).select('name currentLocation vehicleType averageRating totalDeliveries');

            logger.info(`[Assign] Found ${onlineRiders.length} online & available riders. Searching near: ${JSON.stringify(customerLocation)}`);

            if (onlineRiders.length === 0) {
                logger.warn('No online riders found for assignment');
                return null;
            }
            // score riders
            const scoredRiders = onlineRiders.map(rider => {
                if (!rider.currentLocation || !rider.currentLocation.coordinates) {
                    logger.debug(`[Assign] Rider ${rider.name} skipped: Missing location`);
                    return { rider, score: -1 };
                }
                const score = this.calculateRiderScore(rider, customerLocation, OUTLET_LOCATION);
                logger.info(`[Assign] Scored Rider: ${rider.name}, Score: ${score.toFixed(2)}, Dist to Outlet: ${getDistance(rider.currentLocation.coordinates[1], rider.currentLocation.coordinates[0], OUTLET_LOCATION.lat, OUTLET_LOCATION.lng).toFixed(0)}m`);
                return { rider, score };
            });
            // sort by score (desc)
            scoredRiders.sort((a, b) => b.score - a.score);
            // return best rider 
            const bestCandidate = scoredRiders.find(r => r.score > 0);
            if (!bestCandidate) {
                logger.warn(`[Assign] No candidates found with score > 0 (Max score: ${scoredRiders[0]?.score?.toFixed(2)})`);
            }
            return bestCandidate ? bestCandidate.rider : null;
        } catch (error) {
            logger.error('Error finding best rider:', error);
            return null;
        }
    }
    // calculate rider score (0-100)
    calculateRiderScore(rider, customerLocation, outletLocation) {
        let score = 100;
        const riderLat = rider.currentLocation.coordinates[1];
        const riderLng = rider.currentLocation.coordinates[0];
        const distToOutlet = getDistance(riderLat, riderLng, outletLocation.lat, outletLocation.lng);

        // -5 points per km away from outlet (Less punishing)
        score -= (distToOutlet / 1000) * 5;

        const distToCustomer = getDistance(riderLat, riderLng, customerLocation.lat, customerLocation.lng);
        // small penalty for being far from customer (1 point per km)
        score -= (distToCustomer / 1000) * 1;

        // Rating bonus
        if (rider.averageRating > 4.0) {
            score += (rider.averageRating - 4.0) * 20;
        }
        // Experience bonus
        score += Math.min((rider.totalDeliveries || 0) / 100, 10);

        // Ensure score doesn't drop to zero too easily for local riders
        return Math.max(score, 1);
    }
}

export const riderAssignmentService = new RiderAssignmentService();