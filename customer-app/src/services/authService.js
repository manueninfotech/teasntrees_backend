import apiClient from './apiClient';

const authService = {
    sendOTP: async (mobile) => {
        try {
            const response = await apiClient.post('/auth/send-otp', { mobile });
            return response;
        } catch (error) {
            throw error;
        }
    },

    verifyOTP: async (mobile, otp) => {
        try {
            const response = await apiClient.post('/auth/verify-otp', { mobile, otp });

            // Check if profile is complete
            if (response.success && response.data) {
                // If profile is complete, store tokens
                if (response.data.token) {
                    localStorage.setItem('auth_token', response.data.token);
                    localStorage.setItem('refresh_token', response.data.refreshToken);
                    localStorage.setItem('user_data', JSON.stringify(response.data.user));
                }
                // If profile is incomplete, don't store tokens yet
                // Return the response with isNewUser and isProfileComplete flags
            }

            return response;
        } catch (error) {
            throw error;
        }
    },

    completeProfile: async (mobile, name, email, address) => {
        try {
            const response = await apiClient.post('/auth/complete-profile', {
                mobile,
                name,
                email,
                address
            });

            if (response.success && response.data) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('refresh_token', response.data.refreshToken);
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
            }

            return response;
        } catch (error) {
            throw error;
        }
    },

    refreshToken: async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await apiClient.post('/auth/refresh-token', { refreshToken });

            if (response.success) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('refresh_token', response.refreshToken);
            }

            return response;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                await apiClient.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        return !!token;
    },

    getCurrentUser: () => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }
};

export default authService;
