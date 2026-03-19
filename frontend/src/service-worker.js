/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

clientsClaim();
self.skipWaiting();

// Precache todos os assets gerados pelo CRA (injetado automaticamente no build)
precacheAndRoute(self.__WB_MANIFEST);

// Navegação SPA — serve sempre o index.html
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(({ request, url }) => {
  if (request.mode !== 'navigate') return false;
  if (url.pathname.startsWith('/_')) return false;
  if (url.pathname.match(fileExtensionRegexp)) return false;
  return true;
}, createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html'));

// Assets estáticos — Cache First (imagens, fontes, ícones)
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'repflow-assets-v1',
    plugins: [],
  })
);

// API — Network First com fallback para cache
// Clientes, materiais e pedidos ficam disponíveis offline
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/clientes') ||
    url.pathname.startsWith('/api/materiais') ||
    url.pathname.startsWith('/api/pedidos') ||
    url.pathname.startsWith('/api/dashboard') ||
    url.pathname.startsWith('/api/metas'),
  new NetworkFirst({
    cacheName: 'repflow-api-v1',
    plugins: [],
  })
);

// JS e CSS do app — StaleWhileRevalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'repflow-static-v1',
  })
);
