const CACHE_NAME = 'kantongin-v2';

const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/database.js',
    '/js/ui/components.js',
    '/js/ui/modal.js',
    '/js/ui/navigation.js',
    '/js/ui/theme.js',
    '/js/ui/account.js',
    '/js/utils/helpers.js',
    '/js/utils/constants.js',
    '/js/utils/chart.js',
    '/manifest.json',

    // Icons - SVG
    '/icons/home.svg',
    '/icons/stats.svg',
    '/icons/profile.svg',
    '/icons/income.svg',
    '/icons/expense.svg',
    '/icons/add.svg',
    '/icons/settings.svg',
    '/icons/logout.svg',
    '/icons/export.svg',
    '/icons/darkmode.svg',
    '/icons/delete.svg',
    '/icons/category-makanan.svg',
    '/icons/category-transportasi.svg',
    '/icons/category-belanja.svg',
    '/icons/category-tagihan.svg',
    '/icons/category-hiburan.svg',
    '/icons/category-lainnya.svg',

    // Icons - PNG
    '/public/icon-192.png',
    '/public/icon-512.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: All assets cached successfully');
                self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache assets:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Now ready to handle fetches!');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    function (response) {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});