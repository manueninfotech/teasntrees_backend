// Profile Service
// Handles user profile API calls

import apiClient from './apiClient';

const profileService = {
    /**
     * Get user profile
     * @returns {Promise} - User profile data
     */
    getProfile: async () => {
        try {
            const response = await apiClient.get('/profile');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update user profile
     * @param {object} profileData - Updated profile data (name, email, address, etc.)
     * @returns {Promise} - Updated profile
     */
    updateProfile: async (profileData) => {
        try {
            const response = await apiClient.put('/profile', profileData);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default profileService;
