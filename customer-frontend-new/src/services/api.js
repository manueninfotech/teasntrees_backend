import axios from 'axios';

// Assuming the backend is running on 5000 based on standard workflows or existing config
// I will use a relative path /api if we set up a proxy, or the absolute URL.
// Given the previous setup, let's use the explicit local URL for now.

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to inject token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
