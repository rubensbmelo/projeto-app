import axios from 'axios';

// URL base do backend
const API_URL = process.env.REACT_APP_API_URL || 'https://projeto-app-bxwr.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 segundos (importante por causa do "sono" do Render no plano gratuito)
});

// ============================================================
// Interceptor de REQUEST — injeta token em todas as chamadas
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Interceptor de RESPONSE — trata erros globalmente
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Token expirado ou inválido — desloga automaticamente
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // Sem permissão
      if (status === 403) {
        console.warn('Acesso negado:', error.response.data?.detail);
      }

      // Erro interno do servidor
      if (status >= 500) {
        console.error('Erro no servidor:', error.response.data);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Timeout: o servidor demorou para responder. Tente novamente.');
    } else if (!error.response) {
      console.error('Sem conexão com o servidor. Verifique sua internet.');
    }

    return Promise.reject(error);
  }
);

export default api;