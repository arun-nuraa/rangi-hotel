import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const menuAPI = {
  getAll: () => API.get('/menu'),
  create: (data) => API.post('/menu', data),
  update: (id, data) => API.put(`/menu/${id}`, data),
  delete: (id) => API.delete(`/menu/${id}`),
};

export const tableAPI = {
  getAll: () => API.get('/tables'),
  create: (data) => API.post('/tables', data),
  update: (id, data) => API.put(`/tables/${id}`, data),
  delete: (id) => API.delete(`/tables/${id}`),
};

export const orderAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    return API.get(`/orders?${params.toString()}`);
  },
  getNextBillNo: () => API.get('/orders/next-bill-no'),
  create: (data) => API.post('/orders', data),
  update: (id, data) => API.put(`/orders/${id}`, data),
  updateStatus: (id, status) => API.put(`/orders/status/${id}`, { status }),
  delete: (id) => API.delete(`/orders/${id}`),
  getSummary: () => API.get('/orders/reports/summary'),
  getSalesReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.get(`/orders/reports/sales?${query}`);
  },
};

export const settingsAPI = {
  get: () => API.get('/settings'),
  update: (data) => API.post('/settings', data),
};

export const backupAPI = {
  export: () => API.get('/backup/export'),
  restore: (data) => API.post('/backup/restore', data),
};

export default API;
