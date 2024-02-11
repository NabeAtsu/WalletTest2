
async function addResourcesToCache(resources) {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
};
  
async function putInCache(request, response) {
    const cache = await caches.open('v1');
    await cache.put(request, response);
};
  
async function cacheFirst({ request, preloadResponsePromise }) {
    // First try to get the resource from the cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }
  
    // Next try to use the preloaded response, if it's there
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
        console.info('using preload response', preloadResponse);
        putInCache(request, preloadResponse.clone());
        return preloadResponse;
    }
  
    // Next try to get the resource from the network
    try {
        const responseFromNetwork = await fetch(request);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        putInCache(request, responseFromNetwork.clone());
        return responseFromNetwork;
    } catch (error) {
        // const fallbackResponse = await caches.match(fallbackUrl);
        // if (fallbackResponse) {
        //     return fallbackResponse;
        // }
        // when even the fallback response is not available,
        // there is nothing we can do, but we must always
        // return a Response object
        return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
};
  
async function enableNavigationPreload() {
    if (self.registration.navigationPreload) {
        // Enable navigation preloads!
        await self.registration.navigationPreload.enable();
    }
};

self.addEventListener('activate', event => {
    console.log('Service Worker activated.');
    event.waitUntil(enableNavigationPreload());
});

self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    event.waitUntil(
        addResourcesToCache([
            '/index.html',
            '/src/index.js',
            '/src/modules/logger.js',
            '/src/modules/wallet.js',
        ])
    );
});

self.addEventListener('fetch', event => {
    console.log('Fetching:', event.request.url);
    event.respondWith(
        cacheFirst({
            request: event.request,
            preloadResponsePromise: event.preloadResponse,
        })
    );
});
