import React, { createContext, useState, useContext, useEffect } from 'react';
// 1. Importamos o nosso serviço centralizado
import api from '../services/api'; 

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // O api.js já cuida de colocar o "Bearer" no header automaticamente
          const response = await api.get('/auth/me');
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Sessão expirada ou inválida:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { 
        email: email, 
        password: password 
      });

      const { access_token, user: userData } = response.data;

      // Salvamos no local para persistência
      localStorage.setItem('token', access_token);
      
      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao conectar com o servidor';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (nome, email, password) => {
    try {
      const response = await api.post('/auth/register', { nome, email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);

      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao registrar'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Limpamos o cache de autorização do axios
    api.defaults.headers.common['Authorization'] = '';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading,
      isAdmin: user?.role === 'admin' 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};