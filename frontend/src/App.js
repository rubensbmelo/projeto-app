import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { toast } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Materiais from './pages/Materiais';
import Pedidos from './pages/Pedidos';
import NotasFiscais from './pages/NotasFiscais';
import Comissoes from './pages/Comissoes';
import Metas from './pages/Metas';
import Usuarios from './pages/Usuarios';
import Orcamentos from './pages/Orcamentos';
import Relatorios from './pages/Relatorios';
import Layout from './components/Layout';
import { registerSW, usePWAInstall, useOnlineStatus } from './pwa';
import './App.css';

registerSW();

// ─────────────────────────────────────────────
// Detectores de ambiente
// ─────────────────────────────────────────────
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

// ─────────────────────────────────────────────
// Banner Android/Chrome — com botão instalar
// ─────────────────────────────────────────────
function PWAInstallBannerAndroid() {
  const { canInstall, install, isInstalled } = usePWAInstall();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('repflow-pwa-dismissed') === 'true'
  );

  if (!canInstall || isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('repflow-pwa-dismissed', 'true');
  };

  const handleInstall = () => {
    install();
    localStorage.removeItem('repflow-pwa-dismissed');
  };

  return (
    <div style={styles.banner}>
      <img src="/icons/icon-72x72.png" alt="RepFlow" width={36} height={36} style={{ borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Instalar RepFlow</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Acesse sem internet, mais rápido</div>
      </div>
      <button onClick={handleInstall} style={styles.btnInstall}>Instalar</button>
      <button onClick={handleDismiss} title="Fechar" style={styles.btnClose}>✕</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Banner iOS/Safari — instrução manual
// ─────────────────────────────────────────────
function PWAInstallBannerIOS() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('repflow-ios-dismissed') === 'true'
  );

  // Só mostra se for iOS + Safari + não instalado + não dispensado
  if (!isIOS() || !isSafari() || isStandalone() || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('repflow-ios-dismissed', 'true');
  };

  return (
    <div style={styles.bannerIOS}>
      {/* Setinha apontando para baixo (onde fica o botão compartilhar no iPhone) */}
      <div style={styles.iosArrow} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img src="/icons/icon-72x72.png" alt="RepFlow" width={32} height={32} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Instalar RepFlow no iPhone</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>3 passos simples</div>
        </div>
        <button onClick={handleDismiss} title="Fechar" style={{ ...styles.btnClose, marginLeft: 'auto' }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={styles.iosStep}>
          <span style={styles.iosNum}>1</span>
          <span style={{ fontSize: 13 }}>
            Toque no botão <strong>Compartilhar</strong>{' '}
            <span style={{ fontSize: 16 }}>⬆️</span>{' '}
            na barra inferior do Safari
          </span>
        </div>
        <div style={styles.iosStep}>
          <span style={styles.iosNum}>2</span>
          <span style={{ fontSize: 13 }}>
            Role para baixo e toque em{' '}
            <strong>"Adicionar à Tela de Início"</strong>
          </span>
        </div>
        <div style={styles.iosStep}>
          <span style={styles.iosNum}>3</span>
          <span style={{ fontSize: 13 }}>
            Toque em <strong>Adicionar</strong> no canto superior direito
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Indicador de conexão offline
// ─────────────────────────────────────────────
function OnlineStatusIndicator() {
  const { isOnline, pendingCount } = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) {
      toast.warning('Sem internet — modo offline ativo', {
        description: 'Suas ações serão salvas e sincronizadas quando voltar.',
        duration: 5000,
      });
    } else if (pendingCount > 0) {
      toast.info(`Sincronizando ${pendingCount} ação(ões) pendente(s)...`, {
        duration: 3000,
      });
    }
  }, [isOnline, pendingCount]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '1rem', right: '1rem', zIndex: 9998,
      background: isOnline ? '#1D4ED8' : '#DC2626',
      color: '#fff', borderRadius: 8, padding: '6px 12px',
      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isOnline ? '#93C5FD' : '#FCA5A5', display: 'inline-block',
      }} />
      {isOnline
        ? `Sincronizando ${pendingCount} item(ns)...`
        : `Offline${pendingCount > 0 ? ` — ${pendingCount} pendente(s)` : ''}`}
    </div>
  );
}

// ─────────────────────────────────────────────
// Estilos compartilhados
// ─────────────────────────────────────────────
const styles = {
  banner: {
    position: 'fixed', bottom: '1rem', left: '50%',
    transform: 'translateX(-50%)', zIndex: 9999,
    background: '#1E3A5F', color: '#fff', borderRadius: 12,
    padding: '12px 20px', display: 'flex', alignItems: 'center',
    gap: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    maxWidth: 380, width: '90%',
  },
  bannerIOS: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
    background: '#1E3A5F', color: '#fff',
    borderRadius: '16px 16px 0 0',
    padding: '16px 20px 28px',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
  },
  iosArrow: {
    width: 40, height: 4, borderRadius: 2,
    background: 'rgba(255,255,255,0.3)',
    margin: '0 auto 14px',
  },
  iosStep: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px',
  },
  iosNum: {
    background: '#2563EB', color: '#fff',
    borderRadius: '50%', width: 22, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  btnInstall: {
    background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: 8, padding: '8px 14px', fontWeight: 600,
    fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnClose: {
    background: 'transparent', color: 'rgba(255,255,255,0.6)',
    border: 'none', borderRadius: 6, padding: '4px 6px',
    fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0,
  },
};

// ─────────────────────────────────────────────
// Proteção de rotas
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

// ─────────────────────────────────────────────
// App Principal
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/materiais" element={<ProtectedRoute><Materiais /></ProtectedRoute>} />
          <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
          <Route path="/comissoes" element={<ProtectedRoute><Comissoes /></ProtectedRoute>} />
          <Route path="/orcamentos" element={<ProtectedRoute><Orcamentos /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/notas-fiscais" element={<ProtectedRoute adminOnly={true}><NotasFiscais /></ProtectedRoute>} />
          <Route path="/metas" element={<ProtectedRoute adminOnly={true}><Metas /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute adminOnly={true}><Usuarios /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Android/Chrome — banner com botão instalar */}
      <PWAInstallBannerAndroid />

      {/* iOS/Safari — instrução manual passo a passo */}
      <PWAInstallBannerIOS />

      {/* Indicador offline */}
      <OnlineStatusIndicator />

      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;