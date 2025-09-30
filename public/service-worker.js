/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'tax-calculator-cache-v1';
const URLS_TO_CACHE = [
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// Install
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static files');
      return cache.addAll(URLS_TO_CACHE);
    }).catch(err => {
      console.error('[Service Worker] Failed to cache', err);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    // Network first for index.html (avoids white screen)
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  } else {
    // Cache first for everything else
    event.respondWith(
      caches.match(event.request).then((res) => res || fetch(event.request))
    );
  }
});

