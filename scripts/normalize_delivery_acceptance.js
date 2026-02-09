import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Delivery from '../src/models/Delivery.js';
import Order from '../src/models/Order.js';

// Normalize deliveries that were auto-marked as heading_to_pickup on accept
// This script DRY-RUNS by default. Use --apply to commit changes.

dotenv.config({ path: new URL('../.env', import.meta.url) });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI/MONGODB_URI');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const MAX_ACCEPTED_AGE_MINUTES = 40; // only normalize very recent auto-accepts

const withinMinutes = (a, b, minutes) => {
  const diff = Math.abs(a.getTime() - b.getTime());
  return diff <= minutes * 60 * 1000;
};

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const candidates = await Delivery.find({
    status: 'heading_to_pickup',
    pickedUpAt: { $exists: false },
    acceptedAt: { $exists: true }
  }).select('_id orderId riderId status acceptedAt updatedAt createdAt');

  const filtered = candidates.filter(d => {
    if (!d.acceptedAt || !d.updatedAt) return false;
    // Only if update happened right at acceptance, and it�s very recent
    return withinMinutes(d.updatedAt, d.acceptedAt, 2) && withinMinutes(new Date(), d.acceptedAt, MAX_ACCEPTED_AGE_MINUTES);
  });

  console.log(`Found ${filtered.length} candidate deliveries (out of ${candidates.length}).`);

  if (!APPLY) {
    filtered.forEach(d => {
      console.log(`DRY-RUN: would set delivery ${d._id} -> accepted (order ${d.orderId})`);
    });
    await mongoose.disconnect();
    return;
  }

  for (const delivery of filtered) {
    delivery.status = 'accepted';
    await delivery.save();

    // If order is currently assigned due to the old mapping but kitchen not ready, revert it
    const order = await Order.findById(delivery.orderId);
    if (order && order.status === 'assigned') {
      if (!['delivered', 'cancelled'].includes(order.status)) {
        order.status = 'waiting_for_rider';
        order.$locals.allowDeliverySync = true;
        await order.save();
      }
    }
  }

  console.log('Applied normalization.');
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Normalize script failed:', err);
  process.exit(1);
});
