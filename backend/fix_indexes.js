import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function fixIndexes() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Drop the old index on mobile
        try {
            await usersCollection.dropIndex('mobile_1');
            console.log("Dropped mobile_1 index.");
        } catch (e) {
            console.log("mobile_1 index not found or already dropped.");
        }
        
        // Drop the old index on email
        try {
            await usersCollection.dropIndex('email_1');
            console.log("Dropped email_1 index.");
        } catch (e) {
            console.log("email_1 index not found or already dropped.");
        }

        // Create new indexes
        await usersCollection.createIndex({ mobile: 1, role: 1 }, { unique: true, sparse: true });
        console.log("Created { mobile: 1, role: 1 } index.");
        
        await usersCollection.createIndex({ email: 1, role: 1 }, { unique: true, sparse: true });
        console.log("Created { email: 1, role: 1 } index.");

        console.log("Indexes fixed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
}

fixIndexes();
