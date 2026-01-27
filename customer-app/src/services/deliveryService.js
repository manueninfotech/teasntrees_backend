// Delivery Service
// Handles delivery tracking API calls

import apiClient from './apiClient';

const deliveryService = {
    /**
     * Get all user deliveries
     * @returns {Promise} - List of deliveries
     */
    getMyDeliveries: async () => {
        try {
            const response = await apiClient.get('/deliveries');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Track specific delivery
     * @param {string} deliveryId - Delivery ID
     * @returns {Promise} - Delivery tracking details
     */
    trackDelivery: async (deliveryId) => {
        try {
            const response = await apiClient.get(`/deliveries/${deliveryId}/track`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get delivery by order ID
     * @param {string} orderId - Order ID
     * @returns {Promise} - Delivery details
     */
    getDeliveryByOrder: async (orderId) => {
        try {
            const response = await apiClient.get(`/deliveries/order/${orderId}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default deliveryService;
