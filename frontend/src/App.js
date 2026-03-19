import React, { useEffect, useState } from 'react';
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
import Usuarios from './pages/Usuarios';
import Orcamentos from './pages/Orcamentos';
import Relatorios from './pages/Relatorios';
import Layout from './components/Layout';
import './App.css';

// ─────────────────────────────────────────────
// localStorage seguro — não quebra no iOS privado
// ─────────────────────────────────────────────
const storage = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, val); } catch {} },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};

// ─────────────────────────────────────────────
// Detectores iOS/Safari
// ─────────────────────────────────────────────
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const isStandalone = () => {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  } catch { return false; }
};

// ─────────────────────────────────────────────
// Banner Android/Chrome
// ─────────────────────────────────────────────
function PWAInstallBannerAndroid() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => storage.get('repflow-pwa-dismissed') === 'true'
  );

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed || isStandalone()) return null;

  const handleInstall = async () => {
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    storage.remove('repflow-pwa-dismissed');
  };

  const handleDismiss = () => {
    setDismissed(true);
    storage.set('repflow-pwa-dismissed', 'true');
  };

  return (
    <div style={styles.banner}>
      <img src="/icons/icon-72x72.png" alt="RepFlow" width={36} height={36} style={{ borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Instalar RepFlow</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Acesse sem internet, mais rápido</div>
      </div>
      <button onClick={handleInstall} style={styles.btnInstall}>Instalar</button>
      <button onClick={handleDismiss} style={styles.btnClose}>✕</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Banner iOS/Safari — instrução manual
// ─────────────────────────────────────────────
function PWAInstallBannerIOS() {
  const [dismissed, setDismissed] = useState(
    () => storage.get('repflow-ios-dismissed') === 'true'
  );

  if (!isIOS() || !isSafari() || isStandalone() || dismissed) return null;

  return (
    <div style={styles.bannerIOS}>
      <div style={styles.iosHandle} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src="/icons/icon-72x72.png" alt="RepFlow" width={32} height={32} style={{ borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Instalar RepFlow no iPhone</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>3 passos simples</div>
        </div>
        <button onClick={() => { setDismissed(true); storage.set('repflow-ios-dismissed', 'true'); }} style={styles.btnClose}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { n: 1, text: <span>Toque em <strong>Compartilhar</strong> ⬆️ na barra do Safari</span> },
          { n: 2, text: <span>Role e toque em <strong>"Adicionar à Tela de Início"</strong></span> },
          { n: 3, text: <span>Toque em <strong>Adicionar</strong> no canto superior direito</span> },
        ].map(({ n, text }) => (
          <div key={n} style={styles.iosStep}>
            <span style={styles.iosNum}>{n}</span>
            <span style={{ fontSize: 13 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Estilos
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
    padding: '12px 20px 32px',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
  },
  iosHandle: {
    width: 36, height: 4, borderRadius: 2,
    background: 'rgba(255,255,255,0.3)',
    margin: '0 auto 14px',
  },
  iosStep: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px',
  },
  iosNum: {
    background: '#2563EB', color: '#fff', borderRadius: '50%',
    width: 22, height: 22, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  btnInstall: {
    background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: 8, padding: '8px 14px', fontWeight: 600,
    fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnClose: {
    background: 'transparent', color: 'rgba(255,255,255,0.6)',
    border: 'none', fontSize: 18, cursor: 'pointer',
    padding: '4px 6px', flexShrink: 0,
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

      <PWAInstallBannerAndroid />
      <PWAInstallBannerIOS />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
