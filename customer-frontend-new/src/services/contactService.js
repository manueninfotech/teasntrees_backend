import api from './api';

const contactService = {
    // Submit contact form
    submitContactForm: async (formData) => {
        try {
            const response = await api.post('/customer/contact', formData);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Something went wrong';
        }
    }
};

export default contactService;
