const CACHE_NAME = 'gratitude-pwa-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/css/styles.css',
  '/src/js/app.js',
  '/manifest.json',
  '/images/banner.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Ensure CSS files have the correct Content-Type header
          if (event.request.url.endsWith('.css')) {
            return response.text().then((body) => {
              return new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  'Content-Type': 'text/css',
                  'Cache-Control': 'no-cache'
                }
              });
            });
          }
          return response;
        }
        // Fetch from network if not in cache
        return fetch(event.request).then((networkResponse) => {
          // Cache the response for future use
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

