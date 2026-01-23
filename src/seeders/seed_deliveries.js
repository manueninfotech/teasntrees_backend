import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

dotenv.config();

const seedDeliveries = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding deliveries...');

        // Get some orders
        const orders = await Order.find({ status: { $ne: 'delivered' } }).limit(5);
        if (orders.length === 0) {
            console.log('No orders found to create deliveries for. Please seed orders first.');
            process.exit(0);
        }

        // Get some riders
        const riders = await User.find({ role: 'rider' }).limit(3);
        if (riders.length === 0) {
            console.log('No riders found. Please seed riders first.');
            process.exit(0);
        }

        // Clear existing deliveries for clean state
        await Delivery.deleteMany({});
        console.log('Cleared existing deliveries.');

        const statuses = ['assigned', 'picked_up', 'in_transit', 'delivered'];

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const rider = riders[i % riders.length];
            const status = statuses[i % statuses.length];

            const delivery = new Delivery({
                orderId: order._id,
                riderId: rider._id,
                customerId: order.customerId,
                pickupLocation: {
                    type: 'Point',
                    coordinates: [77.5946, 12.9716],
                    address: 'TeasNTrees Central Kitchen, Bangalore'
                },
                deliveryLocation: order.deliveryAddress?.location || {
                    type: 'Point',
                    coordinates: [77.6000, 12.9800],
                    address: order.deliveryAddress?.address || 'Sample Customer Address'
                },
                distance: 2.5,
                estimatedTime: 25,
                status: status,
                baseEarning: 30,
                totalEarning: 45,
                assignedAt: new Date(Date.now() - 3600000), // 1 hour ago
            });

            if (status === 'picked_up' || status === 'in_transit' || status === 'delivered') {
                delivery.pickedUpAt = new Date(Date.now() - 1800000); // 30 mins ago
            }

            if (status === 'delivered') {
                delivery.deliveredAt = new Date();
            }

            await delivery.save();
            console.log(`Created delivery ${delivery.deliveryNumber} for Order ${order.orderNumber} - Status: ${status}`);
        }

        console.log(`Successfully seeded ${orders.length} deliveries!`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDeliveries();
