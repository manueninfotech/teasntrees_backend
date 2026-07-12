import mongoose from 'mongoose';

/**
 * One row per checkout attempt, claimed before any order is written.
 *
 * WHY
 * ---
 * Placing an order was not idempotent. If the request reached us and we created
 * the order, but the response never got back to the phone — a timeout, a dropped
 * cell, the app backgrounded mid-flight — the customer saw a failure, tapped
 * "Place order" again, and got a SECOND real order. Duplicate food cooked,
 * duplicate rider dispatched, duplicate cash collected on COD. On Indian mobile
 * networks that is not an edge case.
 *
 * The client now sends a key that stays the same across retries of the SAME
 * checkout (`X-Idempotency-Key`). We claim it here first: the unique index makes
 * the claim atomic, so even two simultaneous requests can't both win.
 *
 * Rows expire after 24h — long enough to cover any plausible retry, short enough
 * that this never becomes a table we have to think about.
 */
const idempotencyKeySchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

// TTL: Mongo drops these automatically 24h after creation.
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);
