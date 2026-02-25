import axios from 'axios';

// Usamos a URL base do Render sem barras extras no final
const API_URL = process.env.REACT_APP_API_URL || 
                import.meta.env?.VITE_API_URL || 
                'https://projeto-app-bxwr.onrender.com';

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