import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Rider from '../models/Rider.js';
import Product from '../models/Product.js';

dotenv.config();

const seedReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing reviews
        await Review.deleteMany({});
        console.log('Cleared existing reviews');

        // Fetch data
        const customers = await User.find({ role: 'customer' });
        const riders = await User.find({ role: 'rider' });
        const products = await Product.find({});
        const orders = await Order.find({ status: 'delivered' });

        if (customers.length === 0 || riders.length === 0 || products.length === 0 || orders.length === 0) {
            console.log('Not enough data to seed reviews. Need customers, riders, products, and delivered orders.');
            process.exit(1);
        }

        const reviews = [];
        const reviewTexts = [
            "Great food! Really enjoyed it.",
            "Delivery was fast, but food was cold.",
            "Rider was very polite. Food was okay.",
            "Excellent service! 5 stars.",
            "Portion size arguably small for the price.",
            "Loved the packaging. Will order again.",
            "Rider got lost but eventually found the place.",
            "Taste was consistent as always.",
            "Missing one item, but they refunded quickly.",
            "Best tea in town!"
        ];

        for (const order of orders) {
            // Chance to review
            if (Math.random() > 0.3) {
                const customer = customers.find(c => c._id.equals(order.customerId)) || customers[0];
                const rider = riders.find(r => r._id.equals(order.riderId)) || riders[0];

                // Pick a random product actually from the order
                let product;
                if (order.items && order.items.length > 0) {
                    const randomItem = order.items[Math.floor(Math.random() * order.items.length)];
                    product = products.find(p => p._id.equals(randomItem.product));
                }

                // Fallback if product not found (shouldn't happen with correct data)
                if (!product) product = products[0];

                const reviewType = Math.random(); // 0-0.33: Food only, 0.33-0.66: Rider only, 0.66-1.0: Both

                let foodRating, riderRating, productRating;

                // Food Only (33%)
                if (reviewType < 0.33) {
                    foodRating = Math.floor(Math.random() * 2) + 4; // 4 or 5
                    productRating = foodRating; // Sync for simplicity
                }
                // Rider Only (33%)
                else if (reviewType < 0.66) {
                    riderRating = Math.floor(Math.random() * 5) + 1; // 1-5 variable
                }
                // Both (33%)
                else {
                    foodRating = Math.floor(Math.random() * 2) + 4;
                    productRating = foodRating;
                    riderRating = Math.floor(Math.random() * 5) + 1;
                }

                const review = {
                    orderId: order._id,
                    customerId: customer._id,
                    riderId: rider._id,
                    productId: product._id,
                    foodRating, // Undefined if Rider Only
                    riderRating, // Undefined if Food Only
                    productRating, // Undefined if Rider Only
                    review: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
                    isVerifiedPurchase: true,
                    isApproved: Math.random() > 0.2 // 80% approved
                };

                reviews.push(review);

                // Update Order model too as per controller logic
                order.foodRating = foodRating;
                order.riderRating = riderRating;
                order.review = review.review;
                await order.save();
            }
        }

        await Review.insertMany(reviews);
        console.log(`Seeded ${reviews.length} reviews.`);

        // Recalculate Rider Ratings
        console.log('Recalculating rider ratings...');
        for (const rider of riders) {
            const riderReviews = await Review.find({ riderId: rider._id, riderRating: { $exists: true } });
            if (riderReviews.length > 0) {
                const totalRating = riderReviews.reduce((sum, r) => sum + r.riderRating, 0);
                const avgRating = totalRating / riderReviews.length;

                // Update using Rider model to ensure discriminator fields are saved
                await Rider.findByIdAndUpdate(rider._id, {
                    averageRating: parseFloat(avgRating.toFixed(1)),
                    ratingsCount: riderReviews.length
                });
                console.log(`Updated rating for rider ${rider.name}: ${avgRating.toFixed(1)}`);
            }
        }
        console.log('Rider ratings updated.');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding reviews:', error);
        process.exit(1);
    }
};

seedReviews();
