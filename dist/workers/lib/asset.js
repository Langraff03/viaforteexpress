import axios from 'axios';
const ASSET_API_KEY = 'admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY';
const ASSET_API_URL = 'https://api.asaas.com/v3';
const assetClient = axios.create({
    baseURL: ASSET_API_URL,
    headers: {
        'access_token': ASSET_API_KEY,
        'Content-Type': 'application/json'
    }
});
export const assetApi = {
    // Clientes
    async createCustomer(data) {
        const response = await assetClient.post('/customers', data);
        return response.data;
    },
    async getCustomer(id) {
        const response = await assetClient.get(`/customers/${id}`);
        return response.data;
    },
    // Pagamentos
    async createPayment(data) {
        const response = await assetClient.post('/payments', data);
        return response.data;
    },
    async getPayment(id) {
        const response = await assetClient.get(`/payments/${id}`);
        return response.data;
    },
    async listPayments(params) {
        const response = await assetClient.get('/payments', { params });
        return response.data;
    }
};
//# sourceMappingURL=asset.js.map