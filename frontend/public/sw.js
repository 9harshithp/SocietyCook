/**
 * SocietyCook Enterprise Service Worker
 * Version: v1.0.0
 * Security: Strict Network-Only for /api/*, zero token/financial data caching.
 */

const CACHE_NAME = 'societycook-pwa-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.ico'
];

// Install: Precache public shell and offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Do not automatically skipWaiting; wait for user confirmation to prevent interrupting active forms
});

// Activate: Clean up previous cache generations
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message: Allow client application to trigger skipWaiting on update prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_USER_DATA') {
    // Purge any runtime cache on logout
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.includes('runtime')) caches.delete(key);
      });
    });
  }
});

// Fetch: Route-aware caching policies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. NON-GET requests (mutations, logins, payments) are strictly network-only
  if (request.method !== 'GET') {
    return;
  }

  // 2. Sensitive API endpoints & User Data: STRICT NETWORK-ONLY (Zero Cache Policy)
  // Never cache auth tokens, resident profiles, bookings, sessions, invoices, or payments
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('onrender.com') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/bookings') ||
    url.pathname.includes('/payments') ||
    url.pathname.includes('/sessions') ||
    url.pathname.includes('/invoices') ||
    url.pathname.includes('/users')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            error: 'Offline',
            message: 'You are currently offline. An active internet connection is required for live updates.'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Navigation requests (HTML Pages): Network-First, fallback to offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, return it directly
          if (response && response.status === 200) {
            return response;
          }
          return response;
        })
        .catch(() => {
          return caches.match('/offline.html').then((fallback) => {
            return fallback || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. Immutable Static Assets (/assets/, /images/, fonts, icons): Cache-First
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

