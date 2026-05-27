import api from './api';

export const productService = {
    // Get all products with filters
    getAllProducts: async ({ category = '', search = '', q = '', brand = '', page = 1, limit = 20 } = {}) => {
        const params = new URLSearchParams();
        // If category is 'all', don't send it to backend so it fetches everything
        if (category && category !== 'all') params.append('category', category);
        if (search) params.append('search', search);
        if (q) params.append('q', q);
        if (brand) params.append('brand', brand);
        params.append('page', page);
        params.append('limit', limit);

        const response = await api.get(`/customer/products?${params.toString()}`);

        // Backend returns: { success: true, data: { products: [], pagination: {} } }
        // We return just the products array for the component to use directly
        return response.data?.data?.products || [];
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
