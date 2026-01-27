// Product Service
// Handles product-related API calls

import apiClient from './apiClient';

const productService = {
    /**
     * Get all products
     * @param {object} filters - Optional filters (category, search, etc.)
     * @returns {Promise} - List of products
     */
    getAllProducts: async (filters = {}) => {
        try {
            const response = await apiClient.get('/products', { params: filters });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get products by category
     * @param {string} categoryId - Category ID
     * @returns {Promise} - List of products in category
     */
    getProductsByCategory: async (categoryId) => {
        try {
            const response = await apiClient.get(`/products/category/${categoryId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get single product by ID
     * @param {string} productId - Product ID
     * @returns {Promise} - Product details
     */
    getProductById: async (productId) => {
        try {
            const response = await apiClient.get(`/products/${productId}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default productService;
