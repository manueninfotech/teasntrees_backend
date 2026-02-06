import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import Rider from '../models/Rider.js';

dotenv.config();

async function debugEta() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const delivery = await Delivery.findOne({ status: { $nin: ['delivered', 'cancelled'] } })
            .populate('orderId')
            .populate('riderId');

        if (!delivery) {
            console.log('No active delivery found to debug');
            process.exit(0);
        }

        console.log('--- Delivery Debug Info ---');
        console.log('ID:', delivery._id);
        console.log('Order Number:', delivery.orderId?.orderNumber);
        console.log('Status:', delivery.status);
        console.log('Pickup Location (Outlet):', JSON.stringify(delivery.pickupLocation?.coordinates));
        console.log('Delivery Location (Customer):', JSON.stringify(delivery.deliveryLocation?.coordinates));
        console.log('Rider Current Location:', JSON.stringify(delivery.riderId?.currentLocation?.coordinates));

        const getDistKm = (lat1, lon1, lat2, lon2) => {
            const toRad = (v) => (v * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        if (delivery.riderId?.currentLocation?.coordinates && delivery.pickupLocation?.coordinates && delivery.deliveryLocation?.coordinates) {
            const rLat = delivery.riderId.currentLocation.coordinates[1];
            const rLng = delivery.riderId.currentLocation.coordinates[0];
            const oLat = delivery.pickupLocation.coordinates[1];
            const oLng = delivery.pickupLocation.coordinates[0];
            const dLat = delivery.deliveryLocation.coordinates[1];
            const dLng = delivery.deliveryLocation.coordinates[0];

            const leg1 = getDistKm(rLat, rLng, oLat, oLng);
            const leg2 = getDistKm(oLat, oLng, dLat, dLng);
            const total = leg1 + leg2;

            console.log(`Leg 1 (Rider -> Outlet): ${leg1.toFixed(2)} km`);
            console.log(`Leg 2 (Outlet -> Customer): ${leg2.toFixed(2)} km`);
            console.log(`Total Distance: ${total.toFixed(2)} km`);
            console.log(`Estimated Minutes (at 25 km/h): ${Math.round((total / 25) * 60)}`);
        } else {
            console.log('Missing some coordinates for distance calculation');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugEta();
