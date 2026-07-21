const CACHE_NAME = 'travel-expense-v4';
const CORE_ASSETS = [
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(CORE_ASSETS.map(url => cache.add(url)))
        )
    );
    self.skipWaiting(); // activate immediately
});

// Activate: wipe ALL old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k))) // delete everything including v1/v2/v3
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first for HTML/JS (always get latest), cache fallback for offline
self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Firebase, exchange rate APIs → network only, no cache
    if (url.includes('googleapis.com') ||
        url.includes('firebase') ||
        url.includes('gstatic.com/firebasejs') ||
        url.includes('er-api.com') ||
        url.includes('exchangerate')) {
        e.respondWith(fetch(e.request));
        return;
    }

    // HTML & JS → network first, update cache, fallback to cache
    e.respondWith(
        fetch(e.request).then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            return response;
        }).catch(() => caches.match(e.request))
    );
});
