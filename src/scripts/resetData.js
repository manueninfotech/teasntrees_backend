import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import ActivityLog from '../models/ActivityLog.js';
import Cart from '../models/Cart.js';
import OTP from '../models/OTP.js';
import Counter from '../models/Counter.js';
import Review from '../models/Review.js';

const resetData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        console.log('Removing Deliveries...');
        await Delivery.deleteMany({});

        console.log('Removing Orders...');
        await Order.deleteMany({});

        console.log('Removing Carts...');
        await Cart.deleteMany({});

        console.log('Removing Activity Logs...');
        await ActivityLog.deleteMany({});

        console.log('Removing OTPs...');
        await OTP.deleteMany({});

        console.log('Removing Reviews...');
        await Review.deleteMany({});

        console.log('Removing Customers and Riders...');
        const userDeleteResult = await User.deleteMany({ role: { $in: ['customer', 'rider'] } });
        console.log(`Deleted ${userDeleteResult.deletedCount} users.`);

        console.log('Resetting Counters...');
        await Counter.deleteMany({}); // Resets order numbering

        console.log('------------------------------------');
        console.log('SUCCESS: Database has been reset!');
        console.log('Preserved: Admins and Managers.');
        console.log('------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('ERROR during reset:', error);
        process.exit(1);
    }
};

resetData();
