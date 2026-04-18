import api from './api';

export const cartService = {
    // Get cart
    getCart: async () => {
        const response = await api.get('/customer/cart');
        return response.data;
    },

    // Add item
    addToCart: async (productId, quantity = 1, customization = '') => {
        const response = await api.post('/customer/cart/add', {
            productId,
            quantity,
            customization
        });
        return response.data;
    },

    // Update item quantity
    updateItem: async (itemId, quantity) => {
        const response = await api.put(`/customer/cart/item/${itemId}`, {
            quantity
        });
        return response.data;
    },

    // Remove item
    removeItem: async (itemId) => {
        const response = await api.delete(`/customer/cart/item/${itemId}`);
        return response.data;
    },

    // Clear cart
    clearCart: async () => {
        const response = await api.delete('/customer/cart/clear');
        return response.data;
    },

    // Checkout
    checkout: async (checkoutData) => {
        // checkoutData: { deliveryAddress, deliveryInstructions, paymentMethod, couponCode }
        const response = await api.post('/customer/cart/checkout', checkoutData);
        return response.data;
    },

    // Validate Coupon
    validateCoupon: async (couponCode, orderValue, brand = null) => {
        const response = await api.post('/customer/coupons/validate', {
            couponCode,
            orderValue,
            brand
        });
        return response.data;
    },

    // Get available coupons for ticker display (public)
    getAvailableCoupons: async (brand = null) => {
        const params = brand ? { brand } : {};
        const response = await api.get('/customer/coupons', { params });
        return response.data;
    }
};
