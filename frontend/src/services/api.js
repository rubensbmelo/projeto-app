import axios from 'axios';

// Essa lógica é fundamental para o Deploy:
// 1. No Vercel, ele usará a variável VITE_API_URL que você cadastrará lá.
// 2. No seu computador, ele continuará usando o localhost.
const API_URL = import.meta.env.VITE_API_URL || 'https://projeto-app-bxwr.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

// Injeta o Token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;