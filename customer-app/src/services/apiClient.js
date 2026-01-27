// API Client Configuration
// Axios instance with base configuration for TeasNTrees backend

import axios from 'axios';

// Base URL for the backend API
const BASE_URL = 'http://localhost:5000/api/customer';

// Create axios instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        // Return the data directly
        return response.data;
    },
    (error) => {
        // Handle different error scenarios
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            // Handle authentication errors
            if (status === 401) {
                // Token expired or invalid
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_data');

                // Redirect to home or show login modal
                window.dispatchEvent(new CustomEvent('auth:logout'));
            }

            // Return error message from backend
            return Promise.reject({
                message: data.message || 'An error occurred',
                status,
                data
            });
        } else if (error.request) {
            // Request made but no response received
            return Promise.reject({
                message: 'Network error. Please check your connection.',
                status: 0
            });
        } else {
            // Something else happened
            return Promise.reject({
                message: error.message || 'An unexpected error occurred',
                status: 0
            });
        }
    }
);

export default apiClient;
