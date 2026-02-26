import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('manager_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple token presence check for now. In a real app, you'd verify the token with the backend.
        if (token) {
            setUser({ role: 'manager' });
        }
        setLoading(false);
    }, [token]);

    const verifyOtp = async (mobile, idToken) => {
        try {
            const response = await api.post('/manager/auth/firebase-login', { idToken });
            const result = response.data;

            if (!result.success) {
                throw new Error(result.message || 'Firebase login failed');
            }

            if (result.data && result.data.token && result.data.user) {
                const accessToken = result.data.token;
                const userData = result.data.user;

                if (!userData.isProfileComplete) {
                    return { success: true, needsProfile: true, user: userData };
                }

                if (!userData.isApproved) {
                    return { success: true, requiresApproval: true, user: userData };
                }

                localStorage.setItem('manager_token', accessToken);
                setToken(accessToken);
                setUser(userData);
                return { success: true, isLoggedIn: true };
            } else {
                return { success: false, message: 'Invalid response from server' };
            }
        } catch (error) {
            console.error('Login Error:', error);
            return { success: false, message: error.message };
        }
    };

    const completeProfile = async (profileData) => {
        try {
            const response = await api.post('/manager/auth/complete-profile', profileData);
            const result = response.data;

            if (!result.success) {
                throw new Error(result.message || 'Profile update failed');
            }

            if (result.data.user && !result.data.user.isApproved) {
                return {
                    success: true,
                    requiresApproval: true,
                    message: 'Profile submitted. Please wait for Admin approval.'
                };
            }

            if (result.data.token && result.data.user) {
                localStorage.setItem('manager_token', result.data.token);
                setToken(result.data.token);
                setUser(result.data.user);
                return { success: true, isLoggedIn: true };
            }

            return { success: true, message: 'Profile updated.' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('manager_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, verifyOtp, completeProfile, logout, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
