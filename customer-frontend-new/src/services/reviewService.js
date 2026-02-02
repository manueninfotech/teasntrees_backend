import api from './api';

export const reviewService = {
    // Create a new general review (for the site)
    createReview: async (reviewData) => {
        // reviewData: { rating, comment }
        const response = await api.post('/customer/reviews', reviewData);
        return response.data;
    },

    // Rate a specific product
    rateProduct: async (productId, rating, comment) => {
        const response = await api.post('/customer/reviews/product', { productId, rating, comment });
        return response.data;
    },

    // Get my reviews
    getMyReviews: async () => {
        const response = await api.get('/customer/reviews/my-reviews');
        return response.data.data.reviews; // Extract reviews array from { data: { reviews, pagination } }
    },

    // Get reviews for a product (public)
    getProductReviews: async (productId) => {
        const response = await api.get(`/customer/reviews/product/${productId}`);
        return response.data.data;
    }
};
