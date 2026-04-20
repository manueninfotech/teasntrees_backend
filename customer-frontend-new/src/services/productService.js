import api from './api';

export const productService = {
    // Get all products with filters
    getAllProducts: async ({ category = '', search = '', q = '', brand = '', page = 1, limit = 20, isSeasonal } = {}) => {
        const params = new URLSearchParams();
        // If category is 'all', don't send it to backend so it fetches everything
        if (category && category !== 'all') params.append('category', category);
        if (search) params.append('search', search);
        if (q) params.append('q', q);
        if (brand) params.append('brand', brand);
        if (isSeasonal) params.append('isSeasonal', 'true');
        params.append('page', page);
        params.append('limit', limit);

        const response = await api.get(`/customer/products?${params.toString()}`);

        // Return full data object so MenuPage can check success and pagination
        return response.data;
    },

    // Get categories from backend
    getCategories: async (brand = '') => {
        const params = new URLSearchParams();
        if (brand) params.append('brand', brand);
        const response = await api.get(`/customer/categories?${params.toString()}`);

        // Backend returns: { success: true, data: [ ...categories ] }
        return response.data?.data || [];
    },

    // Get specific product
    getProductById: async (id) => {
        const response = await api.get(`/customer/products/${id}`);
        return response.data?.data;
    }
};
