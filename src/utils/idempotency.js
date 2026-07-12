import IdempotencyKey from '../models/IdempotencyKey.js';
import Order from '../models/Order.js';
import logger from '../config/logger.js';

/**
 * Makes order placement safe to retry.
 *
 * Without this, a checkout whose response was lost in transit — timeout, dropped
 * cell, app backgrounded — left the customer looking at an error for an order we
 * had actually created. They tap again, and now there are two: two lots of food
 * cooked, two riders dispatched, two COD collections.
 *
 * Usage at the top of an order-creating handler:
 *
 *     const idem = await beginIdempotentOrder(req, res);
 *     if (idem.handled) return;          // replayed or already in flight
 *     ...create orders, stamping idem.key on each...
 *     // on any failure: await releaseIdempotencyKey(idem.key)
 */
export const readIdempotencyKey = (req) =>
    req.headers['x-idempotency-key'] || req.body?.idempotencyKey || null;

const ordersFor = (key, customerId) =>
    Order.find({ idempotencyKey: key, customerId }).lean();

const replay = (res, orders) =>
    res.status(200).json({
        success: true,
        message: 'This order was already placed.',
        idempotentReplay: true,
        data: {
            orders,
            orderId: orders[0]?._id,
            orderNumber: orders[0]?.orderNumber
        }
    });

/**
 * Claim the key for this checkout.
 *
 * Returns `{ handled: true }` when the request needs no further work — either we
 * already created these orders (so we replay the same answer), or an identical
 * request is in flight right now.
 */
export const beginIdempotentOrder = async (req, res) => {
    const key = readIdempotencyKey(req);
    const customerId = req.user.userId;

    // No key (older app build) — behave exactly as before.
    if (!key) return { handled: false, key: null };

    // Already done? Give back the same answer rather than making a second order.
    const existing = await ordersFor(key, customerId);
    if (existing.length) {
        logger.info('Idempotent replay of an existing order', { key, customerId });
        replay(res, existing);
        return { handled: true, key };
    }

    try {
        // The unique index is what makes this atomic: two simultaneous retries
        // race here, and exactly one of them wins.
        await IdempotencyKey.create({ key, customerId });
        return { handled: false, key };
    } catch (err) {
        if (err?.code !== 11000) throw err;

        // Someone else claimed it. Either they've finished (replay their orders)
        // or they're still working (tell the client to look, not to retry).
        const now = await ordersFor(key, customerId);
        if (now.length) {
            replay(res, now);
            return { handled: true, key };
        }

        logger.warn('Concurrent checkout with the same idempotency key', {
            key,
            customerId
        });
        res.status(409).json({
            success: false,
            message:
                "We're still placing that order. Give it a moment, then check your orders.",
            inProgress: true
        });
        return { handled: true, key };
    }
};

/**
 * The checkout failed, so the key must not stay claimed — otherwise a genuine
 * retry would be told "already in progress" forever and the customer could never
 * place the order at all.
 */
export const releaseIdempotencyKey = async (key) => {
    if (!key) return;
    try {
        await IdempotencyKey.deleteOne({ key });
    } catch (err) {
        logger.error('Failed to release idempotency key', {
            key,
            error: err.message
        });
    }
};
