import razorpay from '../../config/razorpay.js';
import Order from '../../models/Order.js';
import crypto from 'crypto';

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, orderId, orderIds } = req.body;
        const targetOrderIds = orderIds || (orderId ? [orderId] : []);

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: targetOrderIds.length > 0 ? targetOrderIds[0] : `rcpt_${Date.now()}`,
        };
        const rzpOrder = await razorpay.orders.create(options);

        if (targetOrderIds.length > 0) {
            await Order.updateMany(
                { _id: { $in: targetOrderIds } },
                { razorpayOrderId: rzpOrder.id }
            );
        }
        res.status(200).json({ success: true, data: { id: rzpOrder.id, amount: rzpOrder.amount, key: process.env.RAZORPAY_KEY_ID } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, orderIds } = req.body;
        const targetOrderIds = orderIds || (orderId ? [orderId] : []);

        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex');

        if (expectedSignature !== razorpay_signature) return res.status(400).json({ success: false, message: 'Invalid signature' });

        if (targetOrderIds.length > 0) {
            const orders = await Order.find({ _id: { $in: targetOrderIds } });

            for (const order of orders) {
                order.paymentStatus = 'paid';
                order.razorpayPaymentId = razorpay_payment_id;
                order.razorpaySignature = razorpay_signature;
                if (order.status === 'pending') {
                    order.status = 'confirmed';
                    order.confirmedAt = new Date();
                }
                await order.save();
            }
        }
        res.status(200).json({ success: true, message: 'Payment verified for all orders' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
