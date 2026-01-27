// Authentication Context
// Manages user authentication state across the application

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = () => {
            const userData = authService.getCurrentUser();
            const isAuth = authService.isAuthenticated();

            if (isAuth && userData) {
                setUser(userData);
                setIsAuthenticated(true);
            }

            setIsLoading(false);
        };

        initAuth();

        // Listen for logout events
        const handleLogout = () => {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoginModalOpen(false);
        };

        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    /**
     * Send OTP to mobile number
     */
    const sendOTP = async (mobile) => {
        try {
            const response = await authService.sendOTP(mobile);
            return response;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Verify OTP and login
     */
    const verifyOTP = async (mobile, otp) => {
        try {
            const response = await authService.verifyOTP(mobile, otp);

            // Only set auth state if profile is complete
            if (response.success && response.data && response.data.token) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Complete user profile after OTP verification
     */
    const completeProfile = async (mobile, name, email, address) => {
        try {
            const response = await authService.completeProfile(mobile, name, email, address);

            if (response.success && response.data) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    /**
     * Update user data
     */
    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        sendOTP,
        verifyOTP,
        completeProfile,
        logout,
        updateUser,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
