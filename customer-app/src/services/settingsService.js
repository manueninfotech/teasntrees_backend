// Settings Service
// Handles fetching application settings (delivery charge, tax, etc.)

import apiClient from './apiClient';

const settingsService = {
    /**
     * Get public application settings
     * @returns {Promise} - Settings object
     */
    getSettings: async () => {
        try {
            const response = await apiClient.get('/settings');
            return response;
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    }
};

export default settingsService;
