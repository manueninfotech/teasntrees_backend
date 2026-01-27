// Cart Service
// Handles cart-related API calls with backend synchronization

import apiClient from './apiClient';

const cartService = {
    /**
     * Get user's cart from backend
     * @returns {Promise} - Cart data with items
     */
    getCart: async () => {
        try {
            const response = await apiClient.get('/cart');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Add item to cart
     * @param {object} itemData - Item details (productId, quantity, customizations)
     * @returns {Promise} - Updated cart
     */
    addToCart: async (itemData) => {
        try {
            const response = await apiClient.post('/cart/add', itemData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update cart item quantity
     * @param {string} itemId - Cart item ID
     * @param {number} quantity - New quantity
     * @returns {Promise} - Updated cart
     */
    updateCartItem: async (itemId, quantity) => {
        try {
            const response = await apiClient.put(`/cart/item/${itemId}`, { quantity });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Remove item from cart
     * @param {string} itemId - Cart item ID
     * @returns {Promise} - Updated cart
     */
    removeCartItem: async (itemId) => {
        try {
            const response = await apiClient.delete(`/cart/item/${itemId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Clear entire cart
     * @returns {Promise} - Empty cart confirmation
     */
    clearCart: async () => {
        try {
            const response = await apiClient.delete('/cart/clear');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Checkout cart - Convert cart to order
     * @param {object} checkoutData - Checkout details (addressId, paymentMethod, etc.)
     * @returns {Promise} - Created order
     */
    checkoutCart: async (checkoutData) => {
        try {
            const response = await apiClient.post('/cart/checkout', checkoutData);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default cartService;
