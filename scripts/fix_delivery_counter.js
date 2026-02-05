import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Delivery from '../src/models/Delivery.js';
import Counter from '../src/models/Counter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found');
    process.exit(1);
}

const extractSeq = (deliveryNumber) => {
    if (!deliveryNumber) return 0;
    const match = deliveryNumber.match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
};

try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Remove the 95xxxx outliers
    const deleteResult = await Delivery.deleteMany({ deliveryNumber: /^DEL95/ });
    console.log(`Removed ${deleteResult.deletedCount} outlier deliveries (DEL95 sequence)`);

    const lastDelivery = await Delivery.findOne({})
        .sort({ deliveryNumber: -1 })
        .select('deliveryNumber')
        .lean();

    const maxSeq = extractSeq(lastDelivery?.deliveryNumber);

    await Counter.findOneAndUpdate(
        { name: 'delivery' },
        { seq: maxSeq },
        { upsert: true, new: true }
    );

    console.log(`Delivery counter reset to ${maxSeq}. Next delivery will be DEL${String(maxSeq + 1).padStart(6, '0')}`);
} catch (err) {
    console.error('Failed to reset delivery counter:', err);
} finally {
    await mongoose.disconnect();
    process.exit(0);
}
