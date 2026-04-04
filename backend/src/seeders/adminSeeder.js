import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/teasntrees_littleh';

async function seedAdmin() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to DB');

        const mobile = '9999999999';
        let user = await User.findOne({ mobile });

        if (user) {
            console.log(`Found user ${mobile}. Current Role: ${user.role}`);
            // Force update to admin and ensure profile completion
            user.role = 'admin';
            user.isProfileComplete = true;
            user.isActive = true;
            user.name = user.name || 'Admin User';
            user.email = user.email || 'admin@teasntrees.com';
            user.address = user.address || '123 Admin St';

            await user.save();
            console.log('UPDATED user to ADMIN role (and fixed profile fields).');
        } else {
            console.log(`User ${mobile} not found. Creating...`);
            await User.create({
                mobile,
                name: 'Test Admin',
                email: 'admin999@test.com',
                address: '123 Admin St',
                role: 'admin',
                isProfileComplete: true,
                isActive: true
            });
            console.log('CREATED Admin user.');
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (e) {
        console.error('Seeding failed:', e);
        process.exit(1);
    }
}

seedAdmin();
