// Wishlist Service
// Handles wishlist API calls

import apiClient from './apiClient';

const wishlistService = {
    /**
     * Get user's wishlist
     * @returns {Promise} - List of wishlist items
     */
    getWishlist: async () => {
        try {
            const response = await apiClient.get('/wishlist');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Add product to wishlist
     * @param {string} productId - Product ID
     * @returns {Promise} - Updated wishlist
     */
    addToWishlist: async (productId) => {
        try {
            const response = await apiClient.post('/wishlist/add', { productId });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Remove product from wishlist
     * @param {string} productId - Product ID
     * @returns {Promise} - Updated wishlist
     */
    removeFromWishlist: async (productId) => {
        try {
            const response = await apiClient.delete(`/wishlist/remove/${productId}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default wishlistService;
