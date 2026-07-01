import Rider from "../models/Rider.js";
import mongoose from "mongoose";
import logger from "../config/logger.js";

class RiderMetricsService {

    //  Update all metrics for a rider
    async updateMetrics(riderId) {
        try {
            const riderIdObj = new mongoose.Types.ObjectId(riderId.toString());
            const rider = await Rider.findById(riderIdObj);
            if (!rider) return;

            const DeliveryModel = mongoose.model('Delivery');
            
            // Re-calculate counts
            const completedCount = await DeliveryModel.countDocuments({ 
                riderId: riderIdObj, 
                status: 'delivered' 
            });
            const rejectedCount = await DeliveryModel.countDocuments({ 
                riderId: riderIdObj, 
                status: 'rejected' 
            });

            // Average Rating
            const deliveriesWithRatings = await DeliveryModel.find({
                riderId: riderIdObj,
                rating: { $exists: true, $ne: null }
            });

            let avgRating = 0;
            if (deliveriesWithRatings.length > 0) {
                const sum = deliveriesWithRatings.reduce((acc, d) => acc + d.rating, 0);
                avgRating = sum / deliveriesWithRatings.length;
            }

            // Total Earnings Calculation
            const earningsData = await DeliveryModel.aggregate([
                { $match: { riderId: riderIdObj, status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$totalEarning' } } }
            ]);
            const totalEarnings = earningsData.length > 0 ? earningsData[0].total : 0;

            logger.info(`[Metrics] Recalculating for ${rider.name}: ${completedCount} delivered, ₹${totalEarnings} total.`);

            // Update Rider Doc
            await Rider.findByIdAndUpdate(riderIdObj, {
                $set: {
                    performanceMetrics: {
                        acceptanceRate: (completedCount + rejectedCount) > 0 
                            ? Math.round((completedCount / (completedCount + rejectedCount)) * 1000) / 10 
                            : 100,
                        completionRate: 100,
                        averageRating: Math.round(avgRating * 10) / 10,
                        totalReviews: deliveriesWithRatings.length
                    },
                    averageRating: Math.round(avgRating * 10) / 10,
                    ratingsCount: deliveriesWithRatings.length,
                    totalDeliveries: completedCount,
                    totalEarnings: totalEarnings
                }
            });

        } catch (error) {
            logger.error('Error updating rider metrics:', error);
        }
    }
}

export const riderMetricsService = new RiderMetricsService();
