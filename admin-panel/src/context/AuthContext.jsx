import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            // Verify token is valid
            api.get('/admin/dashboard/stats')
                .then(() => setUser({ token }))
                .catch(() => {
                    localStorage.removeItem('adminToken');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (mobile, otp) => {
        const response = await api.post('/admin/auth/verify-otp', { mobile, otp });
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
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};