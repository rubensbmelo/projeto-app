import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Materiais from './pages/Materiais';
import Pedidos from './pages/Pedidos';
import NotasFiscais from './pages/NotasFiscais';
import Comissoes from './pages/Comissoes';
import Metas from './pages/Metas'; 
import Layout from './components/Layout';
import './App.css';

// Componente de Proteção Inteligente
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();
  
  // Enquanto o contexto carrega as infos do usuário
  if (loading) return null; 

  // Se não estiver logado, vai para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Se a rota for só para admin e o usuário for comum, volta para o Dashboard
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/projeto-app">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rotas Públicas para Logados (Admin e Consultores) */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/materiais" element={<ProtectedRoute><Materiais /></ProtectedRoute>} />
          <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
          <Route path="/comissoes" element={<ProtectedRoute><Comissoes /></ProtectedRoute>} />
          
          {/* Rotas Restritas (Apenas Admin pode ver Metas e Notas Fiscais) */}
          <Route path="/notas-fiscais" element={
            <ProtectedRoute adminOnly={true}><NotasFiscais /></ProtectedRoute>
          } />
          <Route path="/metas" element={
            <ProtectedRoute adminOnly={true}><Metas /></ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;