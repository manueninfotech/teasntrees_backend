// Review Service
// Handles product reviews and ratings API calls

import apiClient from './apiClient';

const reviewService = {
    /**
     * Create product review
     * @param {object} reviewData - Review details (productId, rating, comment)
     * @returns {Promise} - Created review
     */
    createReview: async (reviewData) => {
        try {
            const response = await apiClient.post('/reviews', reviewData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Rate a product
     * @param {string} productId - Product ID
     * @param {number} rating - Rating (1-5)
     * @returns {Promise} - Rating confirmation
     */
    rateProduct: async (productId, rating) => {
        try {
            const response = await apiClient.post('/reviews/product', { productId, rating });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get user's reviews
     * @returns {Promise} - List of user reviews
     */
    getMyReviews: async () => {
        try {
            const response = await apiClient.get('/reviews/my-reviews');
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default reviewService;
