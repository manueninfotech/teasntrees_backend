/**
 * No payment gateway is wired up yet, so 'Online' orders can never actually be
 * paid — and because the rider treats a non-COD order as "already settled", the
 * food would be handed over and no money would ever be collected.
 *
 * Until Razorpay is live, only COD is a valid way to place an order. Flip
 * ONLINE_PAYMENTS_ENABLED once the gateway is in and verified.
 */
export const ONLINE_PAYMENTS_ENABLED = false;

export const assertPaymentMethodAllowed = (paymentMethod) => {
    const method = String(paymentMethod ?? 'COD');

    if (method !== 'COD' && method !== 'Online') {
        return { ok: false, message: 'Unsupported payment method.' };
    }
    if (method === 'Online' && !ONLINE_PAYMENTS_ENABLED) {
        return {
            ok: false,
            message: 'Online payment is not available yet. Please choose Cash on Delivery.'
        };
    }
    return { ok: true, method };
};
