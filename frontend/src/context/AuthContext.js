import React, { createContext, useState, useContext, useEffect } from 'react';
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

  // Verifica sessão ao carregar a aplicação
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
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

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao conectar com o servidor';
      return { success: false, error: errorMsg };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = '';
  };

  // Criar usuário — apenas admin pode chamar isso
  const criarUsuario = async (nome, email, password, role = 'vendedor') => {
    try {
      const response = await api.post('/usuarios', { nome, email, password, role });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao criar usuário'
      };
    }
  };

  // Trocar senha do usuário logado
  const trocarSenha = async (senha_atual, nova_senha) => {
    try {
      await api.put('/auth/trocar-senha', { senha_atual, nova_senha });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao trocar senha'
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      criarUsuario,
      trocarSenha,
      isAdmin: user?.role === 'admin',
      isVendedor: user?.role === 'vendedor',
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};