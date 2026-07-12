// One-time migration: bcrypt the plaintext verificationPin on every user.
//
// Riders keep the PIN they already know — we simply hash the value that's
// currently stored, so their next login still works while the plaintext stops
// being recoverable from the database.
//
// Safe to re-run: anything already hashed (bcrypt strings start with "$2") is
// skipped.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const looksHashed = (v) => typeof v === 'string' && v.startsWith('$2');

await mongoose.connect(process.env.MONGO_URI);
const users = mongoose.connection.db.collection('users');

const docs = await users
  .find({ verificationPin: { $exists: true, $ne: null } })
  .project({ _id: 1, name: 1, role: 1, mobile: 1, verificationPin: 1 })
  .toArray();

let hashed = 0;
let skipped = 0;

for (const u of docs) {
  if (looksHashed(u.verificationPin)) {
    skipped++;
    continue;
  }
  const hash = await bcrypt.hash(String(u.verificationPin), 10);
  await users.updateOne({ _id: u._id }, { $set: { verificationPin: hash } });
  hashed++;
  console.log(`  hashed ${u.role ?? 'user'} ${u.name ?? ''} (${u.mobile ?? '-'})`);
}

console.log(`\ndone — hashed: ${hashed}, already hashed: ${skipped}, total: ${docs.length}`);
await mongoose.disconnect();
