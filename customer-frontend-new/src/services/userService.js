import api from './api';

export const userService = {
    // Profile
    getProfile: async () => {
        const response = await api.get('/customer/profile');
        return response.data.data.user;
    },

    async updateProfile(updates) {
        const response = await api.put('/customer/profile', updates);
        return response.data.data.user;
    },

    async uploadImage(formData) {
        const response = await api.post('/customer/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data; // Expected { url, publicId, ... }
    },

    // Orders
    getOrders: async (params = {}) => {
        const response = await api.get('/customer/orders/my-orders', { params });
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
    },

    updateAddress: async (id, addressData) => {
        const response = await api.put(`/customer/address/${id}`, addressData);
        return response.data.data;
    },

    deleteAddress: async (id) => {
        const response = await api.delete(`/customer/address/${id}`);
        return response.data.data;
    },

    setDefaultAddress: async (id) => {
        const response = await api.put(`/customer/address/${id}/default`);
        return response.data.data;
    },

    // Wishlist
    getWishlist: async () => {
        const response = await api.get('/customer/wishlist');
        return response.data.data;
    },

    addToWishlist: async (productId) => {
        const response = await api.post('/customer/wishlist/add', { productId });
        return response.data.data;
    },

    removeFromWishlist: async (productId) => {
        const response = await api.delete(`/customer/wishlist/remove/${productId}`);
        return response.data.data;
    }
};
