import mongoose from 'mongoose';
import 'dotenv/config';

const debugReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Define generic schema to read any collection
        const reviewSchema = new mongoose.Schema({}, { strict: false });
        const Review = mongoose.model('Review', reviewSchema);

        const reviews = await Review.find({});
        console.log(`Found ${reviews.length} reviews`);

        for (const r of reviews) {
            console.log('------------------------------------------------');
            console.log(JSON.stringify(r, null, 2));
        }

    } catch (error) {
        console.error('Error debugging reviews:');
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

debugReviews();
