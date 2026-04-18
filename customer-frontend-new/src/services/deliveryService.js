import api from './api';

export const deliveryService = {
    // Get all deliveries for current user
    getMyDeliveries: async () => {
        const response = await api.get('/customer/deliveries');
        return response.data;
    },

    // Track specific delivery
    trackDelivery: async (deliveryId) => {
        const response = await api.get(`/customer/deliveries/${deliveryId}/track`);
        return response.data;
    },

    // Get delivery details by Order ID
    getDeliveryByOrder: async (orderId) => {
        const response = await api.get(`/customer/deliveries/order/${orderId}`);
        return response.data;
    }
};
