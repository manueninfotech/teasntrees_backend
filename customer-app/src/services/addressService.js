// Address Service
// Handles address management API calls

import apiClient from './apiClient';

const addressService = {
    /**
     * Get all user addresses
     * @returns {Promise} - List of addresses
     */
    getAddresses: async () => {
        try {
            const response = await apiClient.get('/address');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Add new address
     * @param {object} addressData - Address details (label, addressLine, location)
     * @returns {Promise} - Created address
     */
    addAddress: async (addressData) => {
        try {
            const response = await apiClient.post('/address', addressData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update existing address
     * @param {string} addressId - Address ID
     * @param {object} addressData - Updated address details
     * @returns {Promise} - Updated address
     */
    updateAddress: async (addressId, addressData) => {
        try {
            const response = await apiClient.put(`/address/${addressId}`, addressData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete address
     * @param {string} addressId - Address ID
     * @returns {Promise} - Deletion confirmation
     */
    deleteAddress: async (addressId) => {
        try {
            const response = await apiClient.delete(`/address/${addressId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Set default address
     * @param {string} addressId - Address ID
     * @returns {Promise} - Updated address
     */
    setDefaultAddress: async (addressId) => {
        try {
            const response = await apiClient.put(`/address/${addressId}/default`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Reverse Geocode (Get address from coords)
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<object>} Address details
     */
    reverseGeocode: async (lat, lng) => {
        try {
            const response = await apiClient.get(`/address/reverse-geocode?lat=${lat}&lng=${lng}`);
            return response;
        } catch (error) {
            console.error('Reverse geocode error:', error);
            throw error;
        }
    }
};

export default addressService;
