import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('adminToken');
        return token ? { token } : null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            // Background verification
            api.get('/admin/dashboard/stats').catch(() => {
                localStorage.removeItem('adminToken');
                setUser(null);
            });
        }
    }, []);

    const verifyOTP = async (mobile, otp) => {
        const response = await api.post('/admin/auth/verify-otp', { mobile, otp });
        const data = response.data.data;

        // Check if profile is complete
        if (data.isProfileComplete === false) {
            // Return user data for profile completion
            return {
                needsProfile: true,
                mobile: mobile,
                isNewUser: data.isNewUser
            };
        }

        // Profile is complete, login directly
        const { token } = data;
        localStorage.setItem('adminToken', token);
        setUser({ token });
        return { needsProfile: false };
    };

    const completeProfile = async (mobile, profileData) => {
        const response = await api.post('/admin/auth/complete-profile', {
            mobile,
            ...profileData
        });
        const { token } = response.data.data;
        localStorage.setItem('adminToken', token);
        setUser({ token });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, verifyOTP, completeProfile, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};