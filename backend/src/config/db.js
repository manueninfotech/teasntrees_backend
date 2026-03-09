import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 100, // Match VUs to avoid socket contention
            socketTimeoutMS: 30000,
        });
        console.log(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);

        // Monitoring is handled via Mongoose hooks in telemetry.js to avoid CMD_NOT_ALLOWED
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
