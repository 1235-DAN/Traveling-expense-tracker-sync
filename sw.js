const CACHE_NAME = 'travel-expense-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;600&family=Noto+Sans+TC:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install: cache core assets
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(ASSETS.map(url => cache.add(url)));
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for assets, network-first for Firebase
self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Firebase & exchange rate API → always network, fallback cache
    if (url.includes('firestore.googleapis.com') ||
        url.includes('firebase') ||
        url.includes('er-api.com') ||
        url.includes('exchangerate')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }

    // Everything else → cache first, then network
    e.respondWith(
        caches.match(e.request).then(cached => {
            return cached || fetch(e.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return response;
            });
        })
    );
});
