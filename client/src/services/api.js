import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const menuAPI = {
  getAll: () => API.get('api/menu'),
  create: (data) => API.post('api/menu', data),
  update: (id, data) => API.put(`api/menu/${id}`, data),
  delete: (id) => API.delete(`api/menu/${id}`),
};

export const tableAPI = {
  getAll: () => API.get('api/tables'),
  create: (data) => API.post('api/tables', data),
  update: (id, data) => API.put(`api/tables/${id}`, data),
  delete: (id) => API.delete(`api/tables/${id}`),
};

export const orderAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    return API.get(`api/orders?${params.toString()}`);
  },
  getNextBillNo: () => API.get('api/orders/next-bill-no'),
  create: (data) => API.post('api/orders', data),
  update: (id, data) => API.put(`api/orders/${id}`, data),
  updateStatus: (id, status) => API.put(`api/orders/status/${id}`, { status }),
  delete: (id) => API.delete(`api/orders/${id}`),
  getSummary: () => API.get('api/orders/reports/summary'),
  getSalesReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.get(`api/orders/reports/sales?${query}`);
  },
};

export const settingsAPI = {
  get: () => API.get('api/settings'),
  update: (data) => API.post('api/settings', data),
};

export const backupAPI = {
  export: () => API.get('api/backup/export'),
  restore: (data) => API.post('api/backup/restore', data),
};

export default API;
