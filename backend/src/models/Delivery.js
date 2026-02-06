import mongoose from 'mongoose';
import './Order.js';
import './User.js';
import Rider from './Rider.js';

/* ----------------------------------
   DELIVERY → ORDER STATUS MAP
----------------------------------- */
const DELIVERY_TO_ORDER_STATUS = {
    // "assigned" here means offer sent; do not mark order assigned yet
    assigned: null,
    // After acceptance/movement, mark order as assigned
    accepted: 'assigned',
    heading_to_pickup: 'assigned',
    arrived_at_pickup: 'assigned',
    picked_up: 'out-for-delivery',
    in_transit: 'in_transit',
    arrived: 'in_transit',
    delivered: 'delivered',
    rejected: 'waiting_for_rider',
    cancelled: 'cancelled'
};

/* ----------------------------------
   DELIVERY SCHEMA
----------------------------------- */
const deliverySchema = new mongoose.Schema({
    deliveryNumber: { type: String, unique: true },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },

    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider',
        required: true
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    pickupLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
        address: String
    },

    deliveryLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
        address: String
    },

    distance: { type: Number, required: true },
    estimatedTime: Number,

    status: {
        type: String,
        enum: [
            'assigned',
            'accepted',
            'rejected',
            'heading_to_pickup',
            'arrived_at_pickup',
            'picked_up',
            'in_transit',
            'arrived',
            'delivered',
            'cancelled'
        ],
        default: 'assigned'
    },

    assignedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    rejectedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    pickupOtp: String,
    deliveryOtp: String,

    baseEarning: { type: Number, required: true },
    distanceBonus: { type: Number, default: 0 },
    surgeBonus: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    totalEarning: { type: Number, required: true },

    isPaid: { type: Boolean, default: false },
    paidAt: Date,

    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    notes: String,
    cancelReason: String,
    rejectionReason: String,
    deliveryProof: String
}, {
    timestamps: true
});

/* ----------------------------------
   INDEXES
----------------------------------- */
deliverySchema.index({ riderId: 1, status: 1 });
deliverySchema.index({ createdAt: -1 });
deliverySchema.index({ pickupLocation: '2dsphere' });
deliverySchema.index({ deliveryLocation: '2dsphere' });

/* ----------------------------------
   DELIVERY NUMBER
----------------------------------- */
deliverySchema.pre('save', async function () {
    if (this.deliveryNumber) return;

    const Counter = mongoose.model('Counter');
    const counter = await Counter.findOneAndUpdate(
        { name: 'delivery' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.deliveryNumber = `DEL${String(counter.seq).padStart(6, '0')}`;
});

/* ----------------------------------
   STATUS CHANGE DETECTION
----------------------------------- */
deliverySchema.pre('save', function () {
    this._statusChanged = this.isModified('status');
    this._riderChanged = this.isModified('riderId');
});

/* ----------------------------------
   HELPER: RELEASE RIDER
----------------------------------- */
const releaseRider = async (riderId) => {
    if (!riderId) return;
    try {
        await Rider.findByIdAndUpdate(riderId, { isOnDelivery: false });
    } catch (error) {
        console.error(`Failed to release rider ${riderId}:`, error);
    }
};

const markRiderBusy = async (riderId) => {
    if (!riderId) return;
    try {
        await Rider.findByIdAndUpdate(riderId, { isOnDelivery: true });
    } catch (error) {
        console.error(`Failed to mark rider busy ${riderId}:`, error);
    }
};

/* ----------------------------------
   ORDER STATUS SYNC (SAFE)
----------------------------------- */
deliverySchema.post('save', async function (delivery) {
    if (!delivery._statusChanged && !delivery._riderChanged) {
        // Fallback: If status is delivered, ensure rider is released anyway
        if (delivery.status === 'delivered') {
            await releaseRider(delivery.riderId);
        }
        return;
    }

    const ACTIVE_RIDER_STATUSES = new Set([
        'heading_to_pickup',
        'arrived_at_pickup',
        'picked_up',
        'in_transit',
        'arrived'
    ]);

    if (ACTIVE_RIDER_STATUSES.has(delivery.status)) {
        await markRiderBusy(delivery.riderId);
    }

    const Order = mongoose.model('Order');
    const order = await Order.findById(delivery.orderId);

    if (!order) return;
    if (['delivered', 'cancelled'].includes(order.status)) return;

    let mutated = false;

    // Sync rider if changed
    if (delivery._riderChanged) {
        if (
            !order.riderId ||
            order.riderId.toString() !== delivery.riderId.toString()
        ) {
            order.riderId = delivery.riderId;
            mutated = true;
        }
    }

    const mappedStatus = DELIVERY_TO_ORDER_STATUS[delivery.status];

    if (mappedStatus && order.status !== mappedStatus) {
        order.status = mappedStatus;
        mutated = true;

        if (mappedStatus === 'assigned' && !order.assignedAt) {
            order.assignedAt = new Date();
        }

        if (mappedStatus === 'out-for-delivery') {
            order.outForDeliveryAt = new Date();
        }

        if (mappedStatus === 'delivered') {
            order.deliveredAt = new Date();
        }

        if (mappedStatus === 'waiting_for_rider') {
            // If the rider rejected/cancelled, clear riderId
            if (
                order.riderId &&
                delivery.riderId &&
                order.riderId.toString() === delivery.riderId.toString()
            ) {
                // ONLY clear if rejected or cancelled
                if (['rejected', 'cancelled'].includes(delivery.status)) {
                    order.riderId = undefined;
                }
            }
        }

        order.timeline.push({
            status: mappedStatus,
            description: `Updated via delivery (${delivery.status})`,
            timestamp: new Date()
        });
    }

    // ALWAYS release rider if status is delivered
    if (delivery.status === 'delivered') {
        await releaseRider(delivery.riderId);
    }

    if (!mutated) return;

    // Allow logistics status updates only from Delivery sync
    order.$locals.allowDeliverySync = true;

    await order.save();
});

/* ----------------------------------
   ATOMIC UPDATE HOOKS
----------------------------------- */
deliverySchema.post('findOneAndUpdate', async function (delivery) {
    if (!delivery) return;

    // For findOneAndUpdate, we always sync if the status is present or if it's a terminal state
    const Order = mongoose.model('Order');
    const order = await Order.findById(delivery.orderId);

    if (order && !['delivered', 'cancelled'].includes(order.status)) {
        const mappedStatus = DELIVERY_TO_ORDER_STATUS[delivery.status];
        if (mappedStatus && order.status !== mappedStatus) {
            order.status = mappedStatus;
            order.timeline.push({
                status: mappedStatus,
                description: `Updated via atomic delivery sync (${delivery.status})`,
                timestamp: new Date()
            });
            order.$locals.allowDeliverySync = true;
            await order.save();
        }
    }

    // Release rider if status is delivered
    if (delivery.status === 'delivered') {
        await releaseRider(delivery.riderId);
    }
});

/* ----------------------------------
   EXPORT
----------------------------------- */
export default mongoose.model('Delivery', deliverySchema);
