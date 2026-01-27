// Category Service
// Handles category-related API calls

import apiClient from './apiClient';

const categoryService = {
    /**
     * Get all categories
     * @returns {Promise} - List of categories
     */
    getAllCategories: async () => {
        try {
            const response = await apiClient.get('/categories');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get single category by ID
     * @param {string} categoryId - Category ID
     * @returns {Promise} - Category details
     */
    getCategoryById: async (categoryId) => {
        try {
            const response = await apiClient.get(`/categories/${categoryId}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default categoryService;
