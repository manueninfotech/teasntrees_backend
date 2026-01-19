import mongoose from 'mongoose';
import User from '../backend/src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teasntrees_littleh';

async function fixAdmin() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to DB');

        const mobile = '9999999999';
        let user = await User.findOne({ mobile });

        if (user) {
            console.log(`Found user ${mobile}. Current Role: ${user.role}`);
            if (user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
                console.log('UPDATED user to ADMIN role.');
            } else {
                console.log('User is already Admin.');
            }
        } else {
            console.log(`User ${mobile} not found. Creating...`);
            await User.create({
                mobile,
                name: 'Test Admin',
                email: 'admin999@test.com',
                role: 'admin',
                isProfileComplete: true,
                isActive: true
            });
            console.log('CREATED Admin user.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixAdmin();
