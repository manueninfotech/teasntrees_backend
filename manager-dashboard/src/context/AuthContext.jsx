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

    // Step 1: Request OTP
    const requestOtp = async (mobile) => {
        try {
            const response = await fetch('http://localhost:5000/api/manager/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    // Step 2: Verify OTP
    const verifyOtp = async (mobile, otp) => {
        try {
            console.log('Verifying OTP Payload:', { mobile, otp });
            const response = await fetch('http://localhost:5000/api/manager/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp }),
            });

            const data = await response.json();

            // Backend returns 200/201 even for partial success, need to check success flag
            if (!response.ok || !data.success) {
                // If it's a known error message, use it
                throw new Error(`${data.message || 'OTP Verification failed'} (for ${mobile})`);
            }

            // Check payload structure from Controller line 190
            let accessToken = null;
            let userData = null;

            if (data.data) {
                // Happy path: Logged in
                if (data.data.token && data.data.user) {
                    accessToken = data.data.token;
                    userData = data.data.user;
                }
                // Partial path: Profile not complete or New User
                else {
                    return {
                        success: true,
                        isNewUser: true,
                        message: data.message || 'Please complete your profile.'
                    };
                }
            }

            if (accessToken && userData) {
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
            const response = await fetch('http://localhost:5000/api/manager/auth/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <AuthContext.Provider value={{ user, token, requestOtp, verifyOtp, completeProfile, logout, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

