import mongoose from 'mongoose';

// A customer-raised issue against an order after a rider is assigned. Kept
// separate from the website Contact form so admins can triage order problems.
const orderComplaintSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        brand: {
            type: String,
            enum: ['teasntrees', 'littleh'],
            required: true
        },
        reason: {
            type: String,
            enum: ['rider_unreachable', 'item_wrong_missing', 'long_delay', 'other'],
            required: true
        },
        notes: { type: String, trim: true, maxlength: 1000 },
        status: {
            type: String,
            enum: ['open', 'in_review', 'resolved'],
            default: 'open'
        }
    },
    { timestamps: true }
);

const OrderComplaint = mongoose.model('OrderComplaint', orderComplaintSchema);

export default OrderComplaint;
