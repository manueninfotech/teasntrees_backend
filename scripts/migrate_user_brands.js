import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateUserBrands = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            role: String,
            brand: String
        }, { strict: false }));

        // 1. Migrate Admins (usually all belong to teasntrees by default)
        const adminsResult = await User.updateMany(
            { role: 'admin', brand: { $exists: false } },
            { $set: { brand: 'teasntrees' } }
        );
        console.log(`Migrated ${adminsResult.modifiedCount} admins to default brand 'teasntrees'`);

        // 2. Migrate Managers (most should already have it, but ensure base User field is set)
        const managersResult = await User.updateMany(
            { role: 'manager', brand: { $exists: false } },
            { $set: { brand: 'teasntrees' } }
        );
        console.log(`Migrated ${managersResult.modifiedCount} managers to default brand 'teasntrees'`);

        console.log('✅ User brand migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateUserBrands();
