import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('manager_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Dynamically extract brand from URL path
        // Expected path: /:brand/...
        const allowedBrands = ['teasntrees', 'littleh'];
        const pathSegments = window.location.pathname.split('/');
        const pathBrand = pathSegments[1] || 'teasntrees';
        const brand = allowedBrands.includes(pathBrand) ? pathBrand : 'teasntrees';

        // Rewrite the URL to include the brand: /api/:brand/manager/...
        // The baseURL is /api, and the components use /manager/...
        if (config.url && !config.url.includes(`/${brand}/`)) {
            config.url = `/${brand}${config.url}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
