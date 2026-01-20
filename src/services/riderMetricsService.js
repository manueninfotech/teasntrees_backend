import Rider from "../models/Rider.js";
import Delivery from "../models/Delivery.js";
import logger from "../config/logger.js";

class RiderMetricsService {

    //  Update all metrics for a rider
    async updateMetrics(riderId) {
        try {
            const rider = await Rider.findById(riderId);
            if (!rider) return;

            // Calculate Acceptance Rate

            const completedCount = await Delivery.countDocuments({ riderId, status: 'delivered' });
            const rejectedCount = await Delivery.countDocuments({ riderId, status: 'rejected' });

            const totalOpportunities = completedCount + rejectedCount; // Simplification
            const acceptanceRate = totalOpportunities > 0
                ? (completedCount / totalOpportunities) * 100
                : 100;

            // Average Rating
            const deliveriesWithRatings = await Delivery.find({
                riderId,
                rating: { $exists: true, $ne: null }
            });

            let avgRating = 5.0;
            if (deliveriesWithRatings.length > 0) {
                const sum = deliveriesWithRatings.reduce((acc, d) => acc + d.rating, 0);
                avgRating = sum / deliveriesWithRatings.length;
            }

            // Update Rider Doc
            rider.performanceMetrics = {
                acceptanceRate: Math.round(acceptanceRate * 10) / 10, // 1 decimal
                completionRate: 100, // Assuming once accepted, they complete it (unless cancelled)
                averageRating: Math.round(avgRating * 10) / 10,
                totalReviews: deliveriesWithRatings.length
            };

            // Update root level rating for easier sorting
            rider.averageRating = rider.performanceMetrics.averageRating;

            await rider.save();
            logger.info(`Updated metrics for rider ${rider.name}: Rating=${avgRating}, AccRate=${acceptanceRate}%`);

        } catch (error) {
            logger.error('Error updating rider metrics:', error);
        }
    }
}

export const riderMetricsService = new RiderMetricsService();
