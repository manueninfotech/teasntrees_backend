// It is a new utility created to handle Dynamic Pricing (Surge)
// Instead of paying riders a flat fee always this service calculates a "multiplier" based on real-time Supply vs. Demand.

import Order from "../models/Order.js";
import Rider from "../models/Rider.js";
import logger from "../config/logger.js";

class SurgeService {
    constructor() {
        this.SURGE_THRESHOLDS = {
            HIGH_DEMAND: 1.5, // 1.5x orders vs riders
            CRITICAL_DEMAND: 2.0 // 2x orders vs riders
        };
    }

    /**
     * Calculate current surge multiplier
     * @returns {Promise<{multiplier: number, reason: string}>}
     */
    async getSurgeMultiplier() {
        try {
            // Count active orders (pending assignment or finding driver)
            const activeOrderCount = await Order.countDocuments({
                status: { $in: ['confirmed', 'preparing', 'ready'] } // Orders needing delivery soon
            });

            // Count available riders
            const onlineRiderCount = await Rider.countDocuments({
                isOnline: true,
                isActive: true,
                isApproved: true,
                isOnDelivery: false
            });

            // Avoid division by zero
            if (onlineRiderCount === 0) {
                if (activeOrderCount > 0) return { multiplier: 2.0, reason: 'No Riders Available' };
                return { multiplier: 1.0, reason: 'Normal' };
            }

            const ratio = activeOrderCount / onlineRiderCount;

            if (ratio >= this.SURGE_THRESHOLDS.CRITICAL_DEMAND) {
                return { multiplier: 1.5, reason: 'Critical Demand' };
            } else if (ratio >= this.SURGE_THRESHOLDS.HIGH_DEMAND) {
                return { multiplier: 1.2, reason: 'High Demand' };
            }

            return { multiplier: 1.0, reason: 'Normal' };

        } catch (error) {
            logger.error('Error calculating surge:', error);
            return { multiplier: 1.0, reason: 'Error' };
        }
    }
}

export const surgeService = new SurgeService();
