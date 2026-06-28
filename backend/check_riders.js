import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function checkRiders() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Drop and recreate index
        try {
            await usersCollection.dropIndex('currentLocation_2dsphere');
            console.log("Dropped currentLocation_2dsphere");
        } catch (e) {
            console.log("Error dropping:", e.message);
        }
        await usersCollection.createIndex({ currentLocation: '2dsphere' });
        console.log("Created currentLocation_2dsphere");
        
        // Test $geoNear
        const pipeline = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [80.4187407, 16.314207] },
                    key: "currentLocation",
                    distanceField: "distanceToOutlet",
                    maxDistance: 500000,
                    query: {
                        isOnline: true,
                        isApproved: true,
                        isActive: true
                    },
                    spherical: true
                }
            }
        ];
        console.log("Running $geoNear...");
        const result = await usersCollection.aggregate(pipeline).toArray();
        console.log(`$geoNear found ${result.length} riders.`);
        result.forEach(r => console.log(`  - ${r.name}, distance: ${r.distanceToOutlet}`));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkRiders();
