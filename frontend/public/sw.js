// ============================================================
// sw.js — Service Worker RepFlow
// Estratégia: Cache First para assets, Network First para API
// Offline: salva pedidos/clientes localmente e sincroniza depois
// ============================================================

const CACHE_VERSION = 'repflow-v1';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_API = `${CACHE_VERSION}-api`;

// Arquivos essenciais para funcionar offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
];

// Rotas da API que podem ser cacheadas para leitura offline
const API_CACHE_ROUTES = [
  '/api/clientes',
  '/api/materiais',
  '/api/pedidos',
  '/api/dashboard/stats',
  '/api/metas',
];

// ─────────────────────────────────────────────
// INSTALL — pré-carrega assets essenciais
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[RepFlow SW] Instalando versão:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[RepFlow SW] Alguns assets não puderam ser cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─────────────────────────────────────────────
// ACTIVATE — limpa caches antigos
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[RepFlow SW] Ativando versão:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('repflow-') && !key.startsWith(CACHE_VERSION))
          .map((key) => {
            console.log('[RepFlow SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─────────────────────────────────────────────
// FETCH — estratégia inteligente por tipo de request
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests que não são GET (POST, PUT, DELETE)
  // Exceto: salva pedidos offline (tratado separado)
  if (request.method !== 'GET') {
    event.respondWith(handleMutation(request));
    return;
  }

  // Requests para a API — Network First com fallback para cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Assets estáticos — Cache First
  event.respondWith(cacheFirstStatic(request));
});

// ─────────────────────────────────────────────
// ESTRATÉGIA 1: Cache First (assets estáticos)
// Busca no cache primeiro, se não tiver vai na rede
// ─────────────────────────────────────────────
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline e não tem cache — retorna página principal
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline — RepFlow', { status: 503 });
  }
}

// ─────────────────────────────────────────────
// ESTRATÉGIA 2: Network First (API)
// Tenta a rede primeiro, cai no cache se offline
// ─────────────────────────────────────────────
async function networkFirstAPI(request) {
  const url = new URL(request.url);
  const isCacheableRoute = API_CACHE_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );

  try {
    const response = await fetch(request);
    // Se for uma rota que pode ser cacheada, salva a resposta
    if (response.ok && isCacheableRoute) {
      const cache = await caches.open(CACHE_API);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sem internet — tenta retornar do cache
    if (isCacheableRoute) {
      const cached = await caches.match(request);
      if (cached) {
        console.log('[RepFlow SW] Offline — retornando cache para:', url.pathname);
        return cached;
      }
    }
    // Sem cache disponível
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Sem conexão. Dados podem estar desatualizados.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ─────────────────────────────────────────────
// ESTRATÉGIA 3: Mutations offline (POST/PUT/DELETE)
// Se offline, salva no IndexedDB e sincroniza depois
// ─────────────────────────────────────────────
async function handleMutation(request) {
  try {
    // Se tiver internet, executa normalmente
    return await fetch(request.clone());
  } catch {
    // Sem internet — salva na fila de sincronização
    const url = new URL(request.url);
    const body = await request.clone().text();

    await savePendingRequest({
      url: request.url,
      method: request.method,
      body,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: Date.now(),
      pathname: url.pathname,
    });

    console.log('[RepFlow SW] Offline — request salvo para sync:', url.pathname);

    return new Response(
      JSON.stringify({
        offline: true,
        message: 'Salvo localmente. Será sincronizado quando voltar a internet.',
        queued: true,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ─────────────────────────────────────────────
// IndexedDB — fila de sincronização offline
// ─────────────────────────────────────────────
function openDB() {
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

async function savePendingRequest(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').add(data);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getPendingRequests() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readonly');
    const req = tx.objectStore('pending').getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deletePendingRequest(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ─────────────────────────────────────────────
// BACKGROUND SYNC — sincroniza quando volta internet
// ─────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'repflow-sync') {
    console.log('[RepFlow SW] Sincronizando requests pendentes...');
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  const pending = await getPendingRequests();
  console.log(`[RepFlow SW] ${pending.length} requests para sincronizar`);

  for (const req of pending) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body || undefined,
      });

      if (response.ok) {
        await deletePendingRequest(req.id);
        console.log('[RepFlow SW] Sincronizado:', req.pathname);

        // Notifica o frontend sobre a sincronização
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({
              type: 'SYNC_SUCCESS',
              pathname: req.pathname,
              timestamp: req.timestamp,
            })
          );
        });
      }
    } catch (err) {
      console.warn('[RepFlow SW] Falha ao sincronizar:', req.pathname, err);
    }
  }
}

// ─────────────────────────────────────────────
// PUSH NOTIFICATIONS — preparado para o futuro
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'RepFlow';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  }
});

console.log('[RepFlow SW] Service Worker carregado — versão:', CACHE_VERSION);
