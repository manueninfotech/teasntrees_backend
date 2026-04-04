import api from './api';

const settingsService = {
    getSettings: async () => {
        const response = await api.get('/customer/settings');
        return response.data;
    }
};

export default settingsService;
