import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected. Migrating settings to per-brand...");
        const db = mongoose.connection.useDb('test');
        const Settings = db.collection('settings');

        const settingsList = await Settings.find({}).toArray();
        if (settingsList.length === 0) {
            console.log("No valid settings to migrate. Creating defaults.");
            await Settings.insertOne({ brand: 'teasntrees', deliveryCharge: 20 });
            await Settings.insertOne({ brand: 'littleh', deliveryCharge: 20 });
        } else {
            console.log("Processing " + settingsList.length + " settings documents");
            const baseSettings = settingsList[0];
            delete baseSettings._id;

            // Re-assert littleh payload
            await Settings.deleteOne({ brand: 'littleh' }); // Clean up if any dirty data

            baseSettings.brand = 'teasntrees';
            await Settings.updateOne({ _id: settingsList[0]._id }, { $set: { brand: 'teasntrees' } });

            const littlehSettings = { ...baseSettings, brand: 'littleh' };
            await Settings.insertOne(littlehSettings);
            console.log("✅ Successfully duplicated and scoped existing settings to both teasingtrees and littleh brands");
        }
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
