import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/managerService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth on mount
        const storedToken = localStorage.getItem('managerToken');
        const storedUser = localStorage.getItem('managerUser');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData, accessToken, refreshToken) => {
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('managerToken', accessToken);
        localStorage.setItem('managerRefreshToken', refreshToken);
        localStorage.setItem('managerUser', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('managerToken');
            localStorage.removeItem('managerRefreshToken');
            localStorage.removeItem('managerUser');
        }
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
