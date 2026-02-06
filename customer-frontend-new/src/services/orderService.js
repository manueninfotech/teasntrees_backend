import api from './api';

export const orderService = {
    // Create new order
    createOrder: async (orderData) => {
        const response = await api.post('/customer/orders', orderData);
        return response.data;
    },

    // Get order details
    getOrderById: async (orderId) => {
        const response = await api.get(`/customer/orders/${orderId}`);
        return response.data.data;
    },

    // Get my orders
    getMyOrders: async (params) => {
        const response = await api.get('/customer/orders/my-orders', { params });
        return response.data.data;
    },

    // Cancel Order
    cancelOrder: async (orderId) => {
        const response = await api.delete(`/customer/orders/${orderId}/cancel`);
        return response.data;
    },

    // Reorder
    reorder: async (orderId) => {
        const response = await api.post(`/customer/orders/${orderId}/reorder`);
        return response.data;
    },

    // Download Invoice
    downloadInvoice: async (orderId) => {
        const response = await api.get(`/customer/orders/${orderId}/invoice`, {
            responseType: 'blob' // Important for handling binary data
        });
        return response.data;
    },

    // Get delivery info by order ID (for live rider location)
    getDeliveryByOrder: async (orderId) => {
        const response = await api.get(`/customer/deliveries/order/${orderId}`);
        return response.data.data;
    }
};
