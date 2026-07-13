/**
 * Drop the legacy single-field unique indexes on `users`.
 *
 * WHY
 * ---
 * A person may be BOTH a customer and a rider on the same phone number. Customer
 * and Rider are separate discriminator documents of User, and the schema has
 * always declared the compound unique indexes that allow exactly that:
 *
 *     { mobile: 1, role: 1 }  unique sparse
 *     { email:  1, role: 1 }  unique sparse
 *
 * But the production collection ALSO still carried the older single-field
 * indexes, `mobile_1` (unique, not even sparse) and `email_1` — Mongoose creates
 * the indexes you declare, and never removes the ones you've stopped declaring.
 * So the database enforced "one account per phone number, full stop", and anyone
 * who had ever shopped with us blew up on rider registration with a raw E11000.
 *
 * `mobile_1` being NON-SPARSE was a second latent bug: a unique index treats a
 * missing field as null, so it also allowed only ONE user in the whole system
 * without a mobile number (e.g. Google sign-ups that never added a phone).
 *
 * Idempotent: safe to run repeatedly, and safe to run before deploy.
 *
 *   node scripts/drop_legacy_user_indexes.mjs           # dry run, reports only
 *   node scripts/drop_legacy_user_indexes.mjs --apply   # actually drops
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const LEGACY = ['mobile_1', 'email_1'];
const REQUIRED = ['mobile_1_role_1', 'email_1_role_1'];

await mongoose.connect(process.env.MONGO_URI);
const users = mongoose.connection.db.collection('users');

const indexes = await users.indexes();
const names = indexes.map((i) => i.name);

console.log(`Connected. ${indexes.length} indexes on 'users'.\n`);

// 1. The compound replacements MUST already exist, or dropping the legacy ones
//    would leave the collection with no uniqueness guard at all.
const missing = REQUIRED.filter((r) => !names.includes(r));
if (missing.length) {
    console.error(
        `REFUSING: the replacement index(es) ${missing.join(', ')} do not exist yet.\n` +
        `Start the app once so Mongoose builds them, then re-run.`
    );
    await mongoose.disconnect();
    process.exit(1);
}
console.log(`✓ Replacement indexes present: ${REQUIRED.join(', ')}`);

// 2. Would the compound index be violated by existing data? If two documents
//    already share a (mobile, role), the compound index would never have built —
//    but check anyway rather than assume.
const dupes = await users
    .aggregate([
        { $match: { mobile: { $ne: null } } },
        { $group: { _id: { mobile: '$mobile', role: '$role' }, n: { $sum: 1 } } },
        { $match: { n: { $gt: 1 } } }
    ])
    .toArray();

if (dupes.length) {
    console.error(`REFUSING: ${dupes.length} (mobile, role) pairs are duplicated:`);
    dupes.forEach((d) => console.error('   ', d._id, `x${d.n}`));
    await mongoose.disconnect();
    process.exit(1);
}
console.log('✓ No duplicate (mobile, role) pairs.\n');

// 3. Report how many numbers are shared across roles today — after the drop,
//    this is the set of people who can hold both accounts.
const shared = await users
    .aggregate([
        { $match: { mobile: { $ne: null } } },
        { $group: { _id: '$mobile', roles: { $addToSet: '$role' } } },
        { $match: { 'roles.1': { $exists: true } } }
    ])
    .toArray();
console.log(`${shared.length} number(s) currently held by more than one role.\n`);

// 4. Drop.
for (const name of LEGACY) {
    if (!names.includes(name)) {
        console.log(`- ${name}: already gone`);
        continue;
    }
    if (!APPLY) {
        console.log(`- ${name}: WOULD DROP (dry run)`);
        continue;
    }
    await users.dropIndex(name);
    console.log(`- ${name}: DROPPED`);
}

if (!APPLY) console.log('\nDry run. Re-run with --apply to drop.');

const after = (await users.indexes()).map((i) => i.name);
console.log(`\nIndexes now: ${after.join(', ')}`);

await mongoose.disconnect();
