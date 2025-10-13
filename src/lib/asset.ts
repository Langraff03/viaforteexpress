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

export interface AssetPayment {
  id: string;
  customer: string;
  value: number;
  status: string;
  dueDate: string;
  description?: string;
}

export interface AssetCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

export const assetApi = {
  // Clientes
  async createCustomer(data: Omit<AssetCustomer, 'id'>): Promise<AssetCustomer> {
    const response = await assetClient.post('/customers', data);
    return response.data;
  },

  async getCustomer(id: string): Promise<AssetCustomer> {
    const response = await assetClient.get(`/customers/${id}`);
    return response.data;
  },

  // Pagamentos
  async createPayment(data: Omit<AssetPayment, 'id'>): Promise<AssetPayment> {
    const response = await assetClient.post('/payments', data);
    return response.data;
  },

  async getPayment(id: string): Promise<AssetPayment> {
    const response = await assetClient.get(`/payments/${id}`);
    return response.data;
  },

  async listPayments(params?: {
    customer?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: AssetPayment[] }> {
    const response = await assetClient.get('/payments', { params });
    return response.data;
  }
};