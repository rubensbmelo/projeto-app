// ============================================================
// src/pwa.js — Registro do Service Worker + Hook de Instalação
//
// COMO USAR no seu App.js:
//   import { registerSW, usePWAInstall } from './pwa';
//   registerSW(); // chame uma vez no topo do App.js
//
// Para mostrar o botão "Instalar app":
//   const { canInstall, install } = usePWAInstall();
// ============================================================

import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────
// 1. Registra o Service Worker
// ─────────────────────────────────────────────
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[RepFlow PWA] Service Worker registrado:', registration.scope);

        // Verifica atualizações a cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // Quando uma nova versão estiver disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[RepFlow PWA] Nova versão disponível!');
              // Dispara evento para o frontend mostrar botão de atualizar
              window.dispatchEvent(new CustomEvent('repflow-update-available'));
            }
          });
        });

        // Escuta mensagens do service worker (ex: sync success)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_SUCCESS') {
            console.log('[RepFlow PWA] Sincronizado:', event.data.pathname);
            window.dispatchEvent(
              new CustomEvent('repflow-sync-success', { detail: event.data })
            );
          }
        });

        // Registra background sync quando voltar a internet
        window.addEventListener('online', async () => {
          console.log('[RepFlow PWA] Conexão restaurada — sincronizando...');
          try {
            await registration.sync.register('repflow-sync');
          } catch {
            // Browser não suporta background sync — sincroniza manualmente
            syncManual();
          }
        });

      } catch (err) {
        console.error('[RepFlow PWA] Erro ao registrar Service Worker:', err);
      }
    });
  }
}

// ─────────────────────────────────────────────
// 2. Sincronização manual (fallback sem background sync)
// ─────────────────────────────────────────────
async function syncManual() {
  const db = await openOfflineDB();
  const pending = await getAllPending(db);

  for (const req of pending) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body || undefined,
      });
      if (response.ok) {
        await deletePending(db, req.id);
        window.dispatchEvent(
          new CustomEvent('repflow-sync-success', {
            detail: { pathname: req.pathname },
          })
        );
      }
    } catch (err) {
      console.warn('[RepFlow PWA] Falha na sync manual:', err);
    }
  }
}

// ─────────────────────────────────────────────
// 3. IndexedDB helpers (espelha o sw.js)
// ─────────────────────────────────────────────
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('repflow-offline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readonly');
    const req = tx.objectStore('pending').getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function deletePending(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ─────────────────────────────────────────────
// 4. Hook — detecta se pode instalar o PWA
// ─────────────────────────────────────────────
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('[RepFlow PWA] App instalado com sucesso!');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[RepFlow PWA] Resultado da instalação:', outcome);
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return { canInstall, install, isInstalled };
}

// ─────────────────────────────────────────────
// 5. Hook — status de conexão
// ─────────────────────────────────────────────
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Conta quantos requests estão pendentes
    const checkPending = async () => {
      try {
        const db = await openOfflineDB();
        const all = await getAllPending(db);
        setPendingCount(all.length);
      } catch {
        setPendingCount(0);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    // Atualiza contador quando sincroniza
    window.addEventListener('repflow-sync-success', checkPending);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('repflow-sync-success', checkPending);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}
