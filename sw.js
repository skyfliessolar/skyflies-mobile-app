// ══════════════════════════════════════════════
// SKYFLIES SOLAR – SERVICE WORKER v3
// Enables offline support & install as app
// ══════════════════════════════════════════════

var CACHE_NAME = 'skyflies-v3';
var URLS_TO_CACHE = [
  '/skyflies-mobile-app/',
  '/skyflies-mobile-app/index.html',
  '/skyflies-mobile-app/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'https://skyflies.in/wp-content/uploads/2025/12/Sky-Flies-Solar.png'
];

// Install — cache all essential files
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.allSettled(URLS_TO_CACHE.map(function(url){
        return cache.add(url).catch(function(err){ console.log('SW cache skip:', url, err); });
      }));
    })
  );
});

// Activate — clean old caches immediately
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Fetch — network first for HTML (always fresh), cache for assets
self.addEventListener('fetch', function(e){
  // Skip non-GET and Apps Script requests
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('script.google.com')) return;
  if(e.request.url.includes('unsplash.com')) return;
  if(e.request.url.includes('rss2json.com')) return;
  if(e.request.url.includes('youtube.com')) return;

  // For HTML pages: network first, fallback to cache
  if(e.request.headers.get('Accept') && e.request.headers.get('Accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(function(response){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        return response;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('/skyflies-mobile-app/index.html');
        });
      })
    );
    return;
  }

  // For other assets: cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(response && response.status === 200 && response.type === 'basic'){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){
        return caches.match('/skyflies-mobile-app/index.html');
      });
    })
  );
});
