import Rider from "../models/Rider.js";
import mongoose from "mongoose";
import logger from "../config/logger.js";

class RiderMetricsService {

    //  Update all metrics for a rider
    async updateMetrics(riderId) {
        try {
            const rider = await Rider.findById(riderId);
            if (!rider) return;

            // Calculate Acceptance Rate

            const DeliveryModel = mongoose.model('Delivery');
            const completedCount = await DeliveryModel.countDocuments({ riderId, status: 'delivered' });
            const rejectedCount = await DeliveryModel.countDocuments({ riderId, status: 'rejected' });

            const totalOpportunities = completedCount + rejectedCount; // Simplification
            const acceptanceRate = totalOpportunities > 0
                ? (completedCount / totalOpportunities) * 100
                : 100;

            // Average Rating
            const deliveriesWithRatings = await DeliveryModel.find({
                riderId,
                rating: { $exists: true, $ne: null }
            });

            let avgRating = 0;
            if (deliveriesWithRatings.length > 0) {
                const sum = deliveriesWithRatings.reduce((acc, d) => acc + d.rating, 0);
                avgRating = sum / deliveriesWithRatings.length;
            }

            // Update Rider Doc
            await Rider.findByIdAndUpdate(riderId, {
                $set: {
                    performanceMetrics: {
                        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
                        completionRate: 100,
                        averageRating: Math.round(avgRating * 10) / 10,
                        totalReviews: deliveriesWithRatings.length
                    },
                    averageRating: Math.round(avgRating * 10) / 10,
                    ratingsCount: deliveriesWithRatings.length,
                    totalDeliveries: completedCount
                }
            });
            logger.info(`Updated metrics for rider ${rider.name}: Rating=${avgRating}, AccRate=${acceptanceRate}%`);

        } catch (error) {
            logger.error('Error updating rider metrics:', error);
        }
    }
}

export const riderMetricsService = new RiderMetricsService();
