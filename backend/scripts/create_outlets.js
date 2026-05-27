import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Outlet from '../src/models/Outlet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Initial DB Error:', err);
        process.exit(1);
    }
};

const createOutlets = async () => {
    try {
        await connectDB();

        const outlets = [
            {
                name: 'Teas N Trees (Lakshmipuram)',
                brand: 'teasntrees',
                address: '1st Lane, Pandaripuram Rd, Lakshmipuram, Ashok Nagar, Guntur, Andhra Pradesh 522002',
                location: {
                    type: 'Point',
                    coordinates: [80.4309655, 16.3090654] // [lng, lat]
                },
                contactPhone: '7286833999',
                isActive: true
            },
            {
                name: 'LittleH Bakery (Brindavan Gardens)',
                brand: 'littleh',
                address: 'Beside SV Hotel, near vijetha super market, Brindavan Gardens, Guntur, Andhra Pradesh 522006',
                location: {
                    type: 'Point',
                    coordinates: [80.4187407, 16.314207] // [lng, lat]
                },
                contactPhone: '8888888888',
                isActive: true
            }
        ];

        for (const outletData of outlets) {
            // Check if exists
            const existing = await Outlet.findOne({ brand: outletData.brand });
            if (existing) {
                console.log(`Outlet for ${outletData.brand} already exists, updating...`);
                await Outlet.updateOne({ _id: existing._id }, outletData);
            } else {
                console.log(`Creating Outlet for ${outletData.brand}...`);
                await Outlet.create(outletData);
            }
        }

        console.log('Outlets successfully created/updated!');

    } catch (err) {
        console.error('Error creating outlets:', err);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
};

createOutlets();
