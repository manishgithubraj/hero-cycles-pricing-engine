import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

export const seedDatabase = () => API.post('/seed');

// Categories
export const getCategories = () => API.get('/categories');

// Parts
export const getParts = (categoryId) =>
  API.get('/parts', { params: categoryId ? { category_id: categoryId } : {} });
export const createPart = (data) => API.post('/parts', data);
export const updatePart = (id, data) => API.put(`/parts/${id}`, data);
export const deletePart = (id) => API.delete(`/parts/${id}`);
export const getPriceHistory = (id) => API.get(`/parts/${id}/price-history`);
export const updatePrice = (id, data) => API.post(`/parts/${id}/update-price`, data);

// Quotes
export const calculateQuote = (data) => API.post('/quotes/calculate', data);
export const saveQuote = (data) => API.post('/quotes/save', data);
export const getQuotes = () => API.get('/quotes');
export const getQuote = (id) => API.get(`/quotes/${id}`);
export const deleteQuote = (id) => API.delete(`/quotes/${id}`);

// Dashboard
export const getDashboardStats = () => API.get('/dashboard/stats');
