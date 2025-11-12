const CACHE_NAME = 'gratitude-pwa-v4';
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
          // Ensure SVG files have the correct Content-Type header
          if (event.request.url.endsWith('.svg')) {
            return response.text().then((body) => {
              return new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  'Content-Type': 'image/svg+xml',
                  'Cache-Control': 'public, max-age=31536000'
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
        }).catch(() => {
          // If fetch fails and it's a navigation request, return the cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
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

