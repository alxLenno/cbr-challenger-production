const CACHE_NAME = 'cbr-challenger-v47';
const STATIC_ASSETS = [
  '/static/css/style.css',
  '/static/css/today.css',
  '/static/css/dashboard.css',
  '/static/css/reference.css',
  '/static/css/analytics.css',
  '/static/css/history.css',
  '/static/css/account.css',
  '/static/css/leaderboard.css',
  '/static/css/card-print.css',
  '/static/css/session_eval.css',
  '/static/js/app.js',
  '/static/js/data.js',
  '/static/js/card-generator.js',
  '/static/js/tabs/today.js',
  '/static/js/tabs/dashboard.js',
  '/static/js/tabs/leaderboard.js',
  '/static/js/tabs/session_eval.js',
  '/static/js/tabs/reference.js',
  '/static/js/tabs/history.js',
  '/static/js/tabs/account.js',
  '/static/js/tabs/analytics.js',
  '/static/icon-192.png',
  '/static/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap'
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for API calls and auth
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/login') || url.pathname.startsWith('/authorize') || url.pathname.startsWith('/logout')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // CSS/JS: always network-first so version bumps take effect immediately
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other static assets (images, fonts, etc.)
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
