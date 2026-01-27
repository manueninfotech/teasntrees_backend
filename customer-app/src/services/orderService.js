// Order Service
// Handles order-related API calls

import apiClient from './apiClient';

const orderService = {
    /**
     * Create a new order
     * @param {object} orderData - Order details (items, address, payment method, etc.)
     * @returns {Promise} - Created order
     */
    createOrder: async (orderData) => {
        try {
            const response = await apiClient.post('/orders', orderData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get all user orders
     * @returns {Promise} - List of orders
     */
    getMyOrders: async () => {
        try {
            const response = await apiClient.get('/orders/my-orders');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get single order by ID
     * @param {string} orderId - Order ID
     * @returns {Promise} - Order details
     */
    getOrderById: async (orderId) => {
        try {
            const response = await apiClient.get(`/orders/${orderId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cancel an order
     * @param {string} orderId - Order ID
     * @returns {Promise} - Cancellation confirmation
     */
    cancelOrder: async (orderId) => {
        try {
            const response = await apiClient.delete(`/orders/${orderId}/cancel`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Reorder a previous order
     * @param {string} orderId - Order ID to reorder
     * @returns {Promise} - New order details
     */
    reorder: async (orderId) => {
        try {
            const response = await apiClient.post(`/orders/${orderId}/reorder`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Download order invoice
     * @param {string} orderId - Order ID
     * @returns {Promise} - Invoice file/URL
     */
    downloadInvoice: async (orderId) => {
        try {
            const response = await apiClient.get(`/orders/${orderId}/invoice`, {
                responseType: 'blob' // For file download
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default orderService;
