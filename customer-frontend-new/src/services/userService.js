import api from './api';

export const userService = {
    // Profile
    getProfile: async () => {
        const response = await api.get('/customer/profile');
        return response.data.data.user;
    },

    updateProfile: async (data) => {
        const response = await api.put('/customer/profile', data);
        return response.data.data;
    },

    // Orders
    getOrders: async () => {
        const response = await api.get('/customer/orders/my-orders');
        return response.data.data.orders;
    },

    // Addresses
    getAddresses: async () => {
        const response = await api.get('/customer/address');
        return response.data.data;
    },

    addAddress: async (addressData) => {
        const response = await api.post('/customer/address', addressData);
        return response.data.data;
    },

    reverseGeocode: async (lat, lng) => {
        const response = await api.get(`/customer/address/reverse-geocode?lat=${lat}&lng=${lng}`);
        return response.data;
    }
};
