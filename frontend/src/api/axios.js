import axios from 'axios';

// In dev, Vite proxies /api to localhost:5000 (see vite.config.js).
// In production, VITE_API_URL must point at the deployed backend's full URL.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
