import axios from 'axios';

const API_URL = 'http://localhost:5000/api/manager';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to inject token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('managerToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor for refreshing token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    // Helper to clear auth and redirect
    const handleLogout = () => {
        localStorage.removeItem('managerToken');
        localStorage.removeItem('managerRefreshToken');
        localStorage.removeItem('managerUser');
        window.location.href = '/login';
        return Promise.reject(error);
    };

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            // If already refreshing, queue this request
            return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return api(originalRequest);
            }).catch(err => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('managerRefreshToken');

        if (!refreshToken) {
            return handleLogout();
        }

        try {
            // Call refresh endpoint
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                refreshToken: refreshToken
            });

            if (response.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                localStorage.setItem('managerToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('managerRefreshToken', newRefreshToken);
                }

                api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

                processQueue(null, accessToken);
                return api(originalRequest);
            } else {
                processQueue(new Error('Refresh failed'), null);
                return handleLogout();
            }
        } catch (refreshError) {
            processQueue(refreshError, null);
            return handleLogout();
        } finally {
            isRefreshing = false;
        }
    }

    return Promise.reject(error);
});

export default api;
