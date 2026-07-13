import razorpay from '../../config/razorpay.js';
import Order from '../../models/Order.js';
import logger from '../../config/logger.js';
import crypto from 'crypto';

/*
 * RAZORPAY. These routes are not mounted yet — they go live the moment
 * paymentRoutes is wired in. Two holes fixed before that happens:
 *
 *  1. THE AMOUNT CAME FROM THE REQUEST BODY. `amount: Math.round(amount * 100)`
 *     let the customer tell us how much to charge them: pay ₹1 for a ₹2,000
 *     order and verifyPayment would mark it paid, because the signature over
 *     (razorpay_order_id | razorpay_payment_id) is perfectly valid for a genuine
 *     ₹1 payment. The signature proves Razorpay processed *a* payment; it says
 *     nothing about it being the *right* payment, for the right amount.
 *
 *  2. NO OWNERSHIP CHECK. Both handlers looked orders up by id alone, so any
 *     authenticated customer could pass someone else's orderIds — stamping their
 *     own razorpayOrderId onto another customer's orders, or driving those
 *     orders to 'paid' / 'confirmed'.
 *
 * The amount is now derived server-side from the orders' own totals, every
 * lookup is scoped to the caller, and the payment is confirmed with Razorpay
 * rather than taken on trust.
 */

/** The caller's own orders — null if any id isn't theirs. */
const loadOwnOrders = async (orderIds, customerId) => {
    if (!orderIds.length) return null;

    const orders = await Order.find({ _id: { $in: orderIds }, customerId });

    // A short result means at least one id wasn't theirs. Refuse the whole
    // request rather than quietly operating on the subset that was.
    if (orders.length !== orderIds.length) return null;
    return orders;
};

const totalPaiseOf = (orders) =>
    Math.round(orders.reduce((sum, o) => sum + (o.total || 0), 0) * 100);

export const createRazorpayOrder = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { orderId, orderIds } = req.body;
        const targetOrderIds = orderIds || (orderId ? [orderId] : []);

        const orders = await loadOwnOrders(targetOrderIds, customerId);
        if (!orders) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (orders.some((o) => o.paymentStatus === 'paid')) {
            return res.status(400).json({
                success: false,
                message: 'That order has already been paid for.'
            });
        }

        // The amount is OURS to decide, not the client's.
        const amountPaise = totalPaiseOf(orders);
        if (!(amountPaise > 0)) {
            return res.status(400).json({
                success: false,
                message: 'That order has nothing to pay.'
            });
        }

        const rzpOrder = await razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: targetOrderIds[0]
        });

        await Order.updateMany(
            { _id: { $in: targetOrderIds }, customerId },
            { razorpayOrderId: rzpOrder.id }
        );

        return res.status(200).json({
            success: true,
            data: {
                id: rzpOrder.id,
                amount: rzpOrder.amount,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        logger.error('createRazorpayOrder error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Could not start the payment.'
        });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
            orderIds
        } = req.body;
        const targetOrderIds = orderIds || (orderId ? [orderId] : []);

        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // Constant-time compare. timingSafeEqual throws on length mismatch, so
        // check that first.
        const providedBuf = Buffer.from(String(razorpay_signature ?? ''), 'utf8');
        const expectedBuf = Buffer.from(expected, 'utf8');
        const signatureOk =
            providedBuf.length === expectedBuf.length &&
            crypto.timingSafeEqual(providedBuf, expectedBuf);

        if (!signatureOk) {
            logger.warn('Razorpay signature mismatch', { customerId, razorpay_order_id });
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const orders = await loadOwnOrders(targetOrderIds, customerId);
        if (!orders) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // The payment must belong to THESE orders.
        if (orders.some((o) => o.razorpayOrderId !== razorpay_order_id)) {
            logger.warn('Razorpay order mismatch', { customerId, razorpay_order_id });
            return res.status(403).json({
                success: false,
                message: 'That payment does not belong to this order.'
            });
        }

        // ...and it must actually have been paid, in full. Ask Razorpay; don't
        // infer it from the signature.
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (!['captured', 'authorized'].includes(payment.status)) {
            return res.status(400).json({
                success: false,
                message: `Payment not completed (${payment.status}).`
            });
        }

        const expectedPaise = totalPaiseOf(orders);
        if (payment.amount < expectedPaise) {
            logger.error('Razorpay underpayment rejected', {
                customerId,
                razorpay_payment_id,
                paid: payment.amount,
                expected: expectedPaise
            });
            return res.status(400).json({
                success: false,
                message: 'The amount paid does not match the order total.'
            });
        }

        for (const order of orders) {
            if (order.paymentStatus === 'paid') continue; // idempotent

            order.paymentStatus = 'paid';
            order.razorpayPaymentId = razorpay_payment_id;
            order.razorpaySignature = razorpay_signature;
            if (order.status === 'pending') {
                order.status = 'confirmed';
                order.confirmedAt = new Date();
            }
            await order.save();
        }

        return res.status(200).json({ success: true, message: 'Payment verified' });
    } catch (error) {
        logger.error('verifyPayment error', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Could not verify the payment.'
        });
    }
};
