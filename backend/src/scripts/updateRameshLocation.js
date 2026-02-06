import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Rider from '../models/Rider.js';
import { geocodingService } from '../services/geocodingService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function updateRider() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const riderId = '69859055b69656891eb075c0';
        const address = 'Arundalpet,Guntur,522601';

        console.log(`Searching coordinates for: ${address}`);
        const coords = await geocodingService.getCoordinates(address);

        if (!coords) {
            console.error('Could not find coordinates for Arundalpet');
            process.exit(1);
        }

        console.log(`Found coordinates: ${coords.lat}, ${coords.lng}`);

        const locObj = {
            type: 'Point',
            coordinates: [coords.lng, coords.lat]
        };

        const result = await Rider.findByIdAndUpdate(riderId, {
            location: locObj,
            currentLocation: {
                ...locObj,
                lastUpdated: new Date()
            }
        }, { new: true });

        if (result) {
            console.log('Rider location updated successfully!');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('Rider not found.');
        }

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateRider();
