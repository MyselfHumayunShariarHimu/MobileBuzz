/**
 * MobileBuzz — Service Worker (Phase 18)
 * Cache-first + versioned cache for the app shell and static knowledge JSON
 * (bump CACHE_NAME on every deploy to invalidate old caches).
 * Network-only (never cached) for /api/* — AI/YouTube/Web results must
 * always be live and fresh, never silently served stale (§47).
 */
var CACHE_NAME = 'mobilebuzz-shell-v1';

var SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/themes.css',
  '/css/style.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/i18n.js',
  '/js/ui.js',
  '/js/storage.js',
  '/js/knowledge.js',
  '/js/devices.js',
  '/js/components.js',
  '/js/tools.js',
  '/js/search.js',
  '/js/diagnostics.js',
  '/js/videos.js',
  '/js/web-search.js',
  '/ai/model-registry.js',
  '/js/ai.js',
  '/js/router.js',
  '/js/pages.js',
  '/js/app.js',
  '/locales/bn/common.json', '/locales/bn/repair.json', '/locales/bn/diagnostics.json', '/locales/bn/ai.json', '/locales/bn/settings.json',
  '/locales/en/common.json', '/locales/en/repair.json', '/locales/en/diagnostics.json', '/locales/en/ai.json', '/locales/en/settings.json',
  '/data/problems.json', '/data/devices.json', '/data/components.json', '/data/tools.json', '/data/synonyms.json', '/data/diagnostic-trees.json', '/data/lessons.json', '/data/error-codes.json',
  '/pages/home.html', '/pages/search.html', '/pages/diagnose.html', '/pages/learn.html', '/pages/ai.html', '/pages/devices.html', '/pages/tools.html', '/pages/videos.html', '/pages/settings.html'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES).catch(function (err) {
        console.warn('[service-worker] some shell files failed to precache:', err);
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Never cache API calls — always hit the network for live AI/YouTube/Web results.
  if (url.pathname.indexOf('/api/') === 0) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for everything else (app shell + static data), falling back
  // to network and caching the response for next time.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response.ok && event.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function () {
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
