import mongoose from 'mongoose';
import logger from '../config/logger.js';
import { notificationService } from './notificationService.js';
import { SOCKET_ROOMS } from '../sockets/socketEvents.js';

/**
 * Watches accepted deliveries for riders who have stopped making progress.
 *
 * THE GAP THIS FILLS
 * ------------------
 * Before acceptance we were covered: a 30s response window, then reassignment,
 * and `riderAssignmentService.checkEscalations` alerts admins about orders that
 * sit unassigned for 5 minutes.
 *
 * After acceptance, nothing watched the rider at all. checkEscalations only
 * queries `status: 'waiting_for_rider'`, and an accepted order has moved past
 * that status — so it was never looked at again. A rider who accepted an order
 * and then went home, pocketed the phone or got a flat tyre left the order
 * frozen indefinitely: the customer watched a stationary bike on the map, no one
 * was alerted, and the only recovery was editing the database by hand.
 *
 * HOW A STALL IS DETECTED
 * -----------------------
 * Time-in-status alone is a bad signal — a long delivery legitimately takes a
 * long time. What matters is whether the rider is *closing the distance* to
 * their current stop. Each tick we measure how far the rider is from the stop
 * they're heading to. If that distance has dropped by a meaningful amount, they
 * are making progress and the clock resets. If it hasn't moved for
 * STALL_NUDGE_MS, we nudge the rider; if it still hasn't after
 * STALL_ESCALATE_MS, we escalate to admins, who can then unassign the delivery.
 *
 * This deliberately tolerates traffic lights, one-way systems and lift rides:
 * a rider crawling toward the customer still closes distance over five minutes.
 */
class DeliveryWatchdogService {
    constructor() {
        this.io = null;

        this.CONFIG = {
            TICK_MS: 60 * 1000,              // how often we look
            STALL_NUDGE_MS: 5 * 60 * 1000,   // no progress for 5 min -> nudge the rider
            STALL_ESCALATE_MS: 10 * 60 * 1000, // still nothing at 10 min -> tell an admin

            // How much closer the rider must get before we call it progress.
            // GPS on a phone in a pocket wanders by a few tens of metres, so
            // anything smaller than this would keep resetting the clock and the
            // watchdog would never fire.
            PROGRESS_METERS: 50,

            // Don't police a rider whose phone hasn't reported in — that's a
            // connectivity problem, and the offline/socket banners already tell
            // them. Without this we'd nudge riders whose GPS simply died.
            MAX_LOCATION_AGE_MS: 3 * 60 * 1000
        };

        // Statuses where the rider is supposed to be travelling. `arrived_at_pickup`
        // is excluded on purpose: a rider waiting at the counter for a slow
        // kitchen is not stalling, and nudging them for it would be wrong.
        this.MOVING_TO_PICKUP = ['accepted', 'heading_to_pickup'];
        this.MOVING_TO_CUSTOMER = ['picked_up', 'in_transit'];
    }

    initialize(io) {
        this.io = io;

        if (process.env.ENABLE_BACKGROUND_JOBS === 'false') {
            logger.info('[DeliveryWatchdog] Disabled via ENABLE_BACKGROUND_JOBS=false');
            return;
        }

        logger.info('[DeliveryWatchdog] Starting stall monitor...');
        setInterval(() => {
            this.checkStalls().catch((err) =>
                logger.error('[DeliveryWatchdog] tick failed', { error: err.message })
            );
        }, this.CONFIG.TICK_MS);
    }

    /** Metres between two [lng, lat] pairs. */
    _metersBetween(a, b) {
        const R = 6371000;
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);

        const h =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    _pointOf(geo) {
        const coords = geo?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const [lng, lat] = coords;
        if (typeof lng !== 'number' || typeof lat !== 'number') return null;
        // [0, 0] is the "no fix yet" seed, not a real position off West Africa.
        if (lng === 0 && lat === 0) return null;
        return { lng, lat };
    }

    async checkStalls() {
        const Delivery = mongoose.model('Delivery');
        const User = mongoose.model('User');

        const active = await Delivery.find({
            status: { $in: [...this.MOVING_TO_PICKUP, ...this.MOVING_TO_CUSTOMER] }
        }).populate('riderId');

        if (!active.length) return;

        const now = Date.now();

        for (const delivery of active) {
            try {
                await this._checkOne(delivery, now, User);
            } catch (err) {
                logger.error('[DeliveryWatchdog] delivery check failed', {
                    deliveryId: delivery._id.toString(),
                    error: err.message
                });
            }
        }
    }

    async _checkOne(delivery, now, User) {
        const rider = delivery.riderId;
        const riderPoint = this._pointOf(rider?.currentLocation);
        if (!riderPoint) return;

        // A phone that hasn't reported in isn't a stalled rider, it's a dead
        // connection — a different problem, already surfaced in the app.
        const lastFix = rider.currentLocation?.lastUpdated;
        if (
            lastFix &&
            now - new Date(lastFix).getTime() > this.CONFIG.MAX_LOCATION_AGE_MS
        ) {
            return;
        }

        const headingToPickup = this.MOVING_TO_PICKUP.includes(delivery.status);
        const stop = this._pointOf(
            headingToPickup ? delivery.pickupLocation : delivery.deliveryLocation
        );
        if (!stop) return;

        const distance = this._metersBetween(riderPoint, stop);

        // First sighting on this leg, or the rider has genuinely closed ground:
        // reset the clock and clear any outstanding nudge.
        const previous = delivery.lastProgressDistance;
        const madeProgress =
            previous === null ||
            previous === undefined ||
            distance < previous - this.CONFIG.PROGRESS_METERS;

        if (madeProgress) {
            delivery.lastProgressDistance = distance;
            delivery.lastProgressAt = new Date(now);
            delivery.stallNudgedAt = null;
            delivery.stallEscalatedAt = null;
            await delivery.save();
            return;
        }

        const stalledFor = now - new Date(delivery.lastProgressAt ?? now).getTime();
        const target = headingToPickup ? 'the store' : 'the customer';

        // Stage 2: still not moving. A human needs to know.
        if (
            stalledFor >= this.CONFIG.STALL_ESCALATE_MS &&
            !delivery.stallEscalatedAt
        ) {
            await this._escalate(delivery, rider, stalledFor, target, User);
            delivery.stallEscalatedAt = new Date(now);
            await delivery.save();
            return;
        }

        // Stage 1: probably just distracted. A push usually fixes it, without
        // involving anyone.
        if (stalledFor >= this.CONFIG.STALL_NUDGE_MS && !delivery.stallNudgedAt) {
            await this._nudge(delivery, rider, target);
            delivery.stallNudgedAt = new Date(now);
            await delivery.save();
        }
    }

    async _nudge(delivery, rider, target) {
        logger.warn('[DeliveryWatchdog] Nudging stalled rider', {
            deliveryId: delivery._id.toString(),
            riderId: rider._id.toString(),
            status: delivery.status
        });

        await notificationService.sendPush(rider, {
            title: 'Still on your way?',
            body: `Order #${delivery.deliveryNumber ?? ''} is waiting. Are you still heading to ${target}?`.replace(
                '  ',
                ' '
            ),
            data: {
                type: 'delivery_stalled',
                deliveryId: delivery._id.toString()
            }
        });

        this.io?.to(SOCKET_ROOMS.user(rider._id.toString())).emit('delivery:stalled', {
            deliveryId: delivery._id.toString(),
            message: `Are you still heading to ${target}?`
        });
    }

    async _escalate(delivery, rider, stalledFor, target, User) {
        const minutes = Math.round(stalledFor / 60000);

        logger.warn('[DeliveryWatchdog] Escalating stalled delivery', {
            deliveryId: delivery._id.toString(),
            riderId: rider._id.toString(),
            minutes
        });

        this.io
            ?.to('role:admin')
            .to('role:manager')
            .emit('delivery:stalled', {
                deliveryId: delivery._id.toString(),
                orderId: delivery.orderId?.toString(),
                riderId: rider._id.toString(),
                riderName: rider.name,
                riderMobile: rider.mobile,
                status: delivery.status,
                stalledMinutes: minutes
            });

        await notificationService.notifyAdmins(User, {
            title: '🛑 Rider not moving',
            body: `${rider.name || 'A rider'} has not moved toward ${target} for ${minutes} mins on order #${delivery.deliveryNumber ?? delivery._id}.`,
            data: {
                type: 'delivery_stalled',
                deliveryId: delivery._id.toString()
            }
        });
    }
}

export const deliveryWatchdogService = new DeliveryWatchdogService();
