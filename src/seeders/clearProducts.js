import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

async function clearProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Product.deleteMany({});
        console.log(`Deleted ${result.deletedCount} products`);

        console.log('\nProducts cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing products:', error);
        process.exit(1);
    }
}

clearProducts();
