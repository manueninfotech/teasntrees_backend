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

    // Get my orders (already in userService but good to have here too if needed specific filtering)
    getMyOrders: async (params) => {
        const response = await api.get('/customer/orders/my-orders', { params });
        return response.data.data;
    }
};
