import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to inject token and brand
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Extract brand from URL path (e.g., /littleh/menu -> littleh)
    const path = window.location.pathname;
    const allowedBrands = ['littleh', 'teasntrees'];
    const pathBrand = path.split('/')[1]?.toLowerCase();

    const brand = allowedBrands.includes(pathBrand) ? pathBrand : 'teasntrees';

    // Update baseURL dynamicly if needed or just prefix the url
    // If the url already starts with /brand, skip. 
    // But we want to structure it as /api/:brand/customer/...
    if (!config.url.startsWith(`/${brand}`)) {
        config.url = `/${brand}${config.url}`;
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
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/'; // Or use a cleaner navigation method if available context-less
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

        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            return handleLogout();
        }

        try {
            // Call refresh endpoint directly using axios to avoid interceptor loop
            const response = await axios.post(`${API_URL}/customer/auth/refresh-token`, {
                refreshToken: refreshToken
            });

            if (response.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                localStorage.setItem('token', accessToken);
                // Also update refresh token if a new one is returned (rotation)
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
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
