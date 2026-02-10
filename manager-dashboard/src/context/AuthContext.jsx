import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('manager_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            setUser({ role: 'manager' });
        }
        setLoading(false);
    }, [token]);

    // Step 2: Verify OTP (Now accepts idToken)
    const verifyOtp = async (mobile, idToken) => {
        try {
            console.log('Exchanging Firebase Token for Backend JWT');
            const response = await fetch('http://localhost:5000/api/manager/auth/firebase-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Firebase login failed');
            }

            if (data.data && data.data.token && data.data.user) {
                const accessToken = data.data.token;
                const userData = data.data.user;

                // Handle profile completion or approval requirement
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

    // Step 3: Complete Profile
    const completeProfile = async (profileData) => {
        try {
            const token = localStorage.getItem('manager_token'); // Might be partial token
            const response = await fetch('http://localhost:5000/api/manager/auth/complete-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Profile update failed');
            }

            if (data.data.user && !data.data.user.isApproved) {
                return {
                    success: true,
                    requiresApproval: true,
                    message: 'Profile submitted. Please wait for Admin approval.'
                };
            }

            if (data.data.token && data.data.user) {
                localStorage.setItem('manager_token', data.data.token);
                setToken(data.data.token);
                setUser(data.data.user);
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

