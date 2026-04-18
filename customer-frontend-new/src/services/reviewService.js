import api from './api';

export const reviewService = {
    // Create or update review for an order
    createReview: async (reviewData) => {
        const response = await api.post('/customer/reviews', reviewData);
        return response.data;
    },

    // Rate specific product
    rateProduct: async (productData) => {
        const response = await api.post('/customer/reviews/product', productData);
        return response.data;
    },

    // Get customer's own reviews
    getMyReviews: async (page = 1, limit = 10) => {
        const response = await api.get('/customer/reviews/my-reviews', { params: { page, limit } });
        return response.data.data;
    },

    // Get reviews for a product (public)
    getProductReviews: async (productId) => {
        const response = await api.get(`/customer/reviews/product/${productId}`);
        return response.data.data;
    },

    // Get site reviews (public)
    getSiteReviews: async (page = 1, limit = 10) => {
        const response = await api.get('/customer/reviews/site', { params: { page, limit } });
        return response.data.data;
    }
};
