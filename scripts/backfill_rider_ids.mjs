// Backfill readableId (TNT-####) for existing riders that lack one.
// Uses the shared Counter so new registrations continue the sequence.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const users = db.collection('users');
const counters = db.collection('counters');

const riders = await users
  .find({ role: 'rider', $or: [{ readableId: { $exists: false } }, { readableId: null }] })
  .sort({ createdAt: 1 }) // oldest rider gets the lowest number
  .toArray();

console.log(`riders needing an id: ${riders.length}`);

for (const r of riders) {
  const c = await counters.findOneAndUpdate(
    { name: 'rider' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = (c.value ?? c).seq;
  const readableId = `TNT-${String(seq).padStart(4, '0')}`;
  await users.updateOne({ _id: r._id }, { $set: { readableId } });
  console.log(`  ${r.name} (${r.mobile}) -> ${readableId}`);
}

console.log('done');
await mongoose.disconnect();
