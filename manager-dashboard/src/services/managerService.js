import api from './api';

// ==================== AUTH ====================
export const authService = {
    sendOTP: async (mobile) => {
        const response = await api.post('/auth/send-otp', { mobile });
        return response.data;
    },

    verifyOTP: async (mobile, otp) => {
        const response = await api.post('/auth/verify-otp', { mobile, otp });
        return response.data;
    },

    completeProfile: async (profileData) => {
        const response = await api.post('/auth/complete-profile', profileData);
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('managerToken');
        localStorage.removeItem('managerRefreshToken');
        localStorage.removeItem('managerUser');
        return response.data;
    },
};

// ==================== DASHBOARD ====================
export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
};

// ==================== ORDERS ====================
export const ordersService = {
    getOrders: async (params = {}) => {
        const response = await api.get('/orders', { params });
        return response.data;
    },

    getOrderDetails: async (orderId) => {
        const response = await api.get(`/orders/${orderId}`);
        return response.data;
    },

    updateOrderStatus: async (orderId, status) => {
        const response = await api.put(`/orders/${orderId}/status`, { status });
        return response.data;
    },

    assignRider: async (orderId, riderId) => {
        const response = await api.put(`/orders/${orderId}/assign-rider`, { riderId });
        return response.data;
    },
};

// ==================== PRODUCTS ====================
export const productsService = {
    getProducts: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    toggleAvailability: async (productId, isAvailable) => {
        const response = await api.patch(`/products/${productId}/availability`, { isAvailable });
        return response.data;
    },
};

// ==================== RIDERS ====================
export const ridersService = {
    getRiders: async (params = {}) => {
        const response = await api.get('/riders', { params });
        return response.data;
    },

    approveRider: async (riderId) => {
        const response = await api.put(`/riders/${riderId}/approve`);
        return response.data;
    },

    suspendRider: async (riderId, reason) => {
        const response = await api.put(`/riders/${riderId}/suspend`, { reason });
        return response.data;
    },
};

// ==================== CUSTOMERS ====================
export const customersService = {
    getCustomers: async (params = {}) => {
        const response = await api.get('/customers', { params });
        return response.data;
    },

    getCustomerOrders: async (customerId) => {
        const response = await api.get(`/customers/${customerId}/orders`);
        return response.data;
    },
};
