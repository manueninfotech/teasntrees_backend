import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collections = ['products', 'categories', 'orders', 'contacts', 'settings', 'deliveries', 'reviews', 'users'];

        for (const coll of collections) {
            try {
                const result = await mongoose.connection.collection(coll).updateMany(
                    { brand: { $exists: false } },
                    { $set: { brand: 'teasntrees' } }
                );

                console.log(`Migrated ${result.modifiedCount} documents in ${coll}`);
            } catch (e) {
                console.error(`Error migrating ${coll}:`, e.message);
            }
        }
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
