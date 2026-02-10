import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from storage on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    // Ideally we verify token validity here or fetch fresh profile
                    // For now, we trust storage to speed up initial load, and api failures will handle logout
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                    logout();
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    // Step 2: Verify OTP (Now accepts idToken)
    const verifyOtp = async (mobile, idToken) => {
        try {
            const response = await api.post('/customer/auth/firebase-login', { idToken });
            const { token, refreshToken, user } = response.data.data;

            if (token && user?.isProfileComplete) {
                // Login Success
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                return { success: true, user };
            } else {
                // Profile Incomplete (Backend returns data without token for security)
                return { success: false, ...response.data.data };
            }
        } catch (error) {
            throw error.response?.data?.message || 'Failed to verify OTP';
        }
    };

    const completeProfile = async (profileData) => {
        try {
            const response = await api.post('/customer/auth/complete-profile', profileData);
            const { token, refreshToken, user } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true, user };
        } catch (error) {
            throw error.response?.data?.message || 'Failed to complete profile';
        }
    };

    const logout = async () => {
        try {
            await api.post('/customer/auth/logout');
        } catch (error) {
            console.error("Logout API failed", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            verifyOtp,
            completeProfile,
            logout,
            isAuthenticated: !!user,
            token: localStorage.getItem('token') // Expose token for SocketContext
        }}>
            {children}
        </AuthContext.Provider>
    );
};
