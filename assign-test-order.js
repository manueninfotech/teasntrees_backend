import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './src/models/Order.js';
import Rider from './src/models/Rider.js';
import Counter from './src/models/Counter.js';
import { riderAssignmentService } from './src/services/riderAssignmentService.js';

async function testAssign() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find a rider (approved ones)
        const rider = await Rider.findOne({ role: 'rider', isApproved: true });
        if (!rider) {
            console.log('No approved rider found to test with.');
            process.exit(0);
        }
        console.log(`Using Rider: ${rider.name} (${rider.mobile})`);

        // 2. Find an order (ready to be assigned and has location)
        let order = await Order.findOne({
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'waiting_for_rider'] },
            'deliveryAddress.location.coordinates': { $exists: true, $ne: [] }
        });

        if (!order) {
            console.log('No eligible order found. Creating a test order...');
            order = await Order.create({
                customerId: new mongoose.Types.ObjectId(), // Fake customer
                items: [{ name: 'Test Product', quantity: 1, price: 100 }],
                subtotal: 100,
                total: 120,
                paymentMethod: 'COD',
                status: 'ready',
                deliveryAddress: {
                    address: 'Test Address',
                    location: { type: 'Point', coordinates: [80.4308257, 16.3090716] }
                }
            });
        }
        console.log(`Using Order: ${order.orderNumber}`);

        // 3. Manually assign
        await riderAssignmentService.createOrUpdateDelivery(order, rider);
        console.log('Successfully assigned order to rider!');
        console.log('Check your Rider App now.');

        process.exit(0);
    } catch (err) {
        console.error('Test assignment failed!');
        console.error(err.stack || err);
        process.exit(1);
    }
}

testAssign();
