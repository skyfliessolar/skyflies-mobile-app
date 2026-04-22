// ══════════════════════════════════════════════
// SKYFLIES SOLAR – SERVICE WORKER v4
// Enables offline support & install as app
// ══════════════════════════════════════════════

var CACHE_NAME = 'skyflies-v4';
var URLS_TO_CACHE = [
  '/skyflies-mobile-app/',
  '/skyflies-mobile-app/index.html',
  '/skyflies-mobile-app/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'https://skyflies.in/wp-content/uploads/2025/12/Sky-Flies-Solar.png'
];

// Install — cache all essential files
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // addAll can fail if one URL fails — use individual adds for robustness
      return Promise.allSettled(
        URLS_TO_CACHE.map(function(url){ return cache.add(url).catch(function(){}); })
      );
    })
  );
  self.skipWaiting();
});

// Activate — clean ALL old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e){
  // Never intercept Apps Script or external API requests
  if(e.request.url.includes('script.google.com') ||
     e.request.url.includes('firestore.googleapis.com') ||
     e.request.url.includes('firebase') ||
     e.request.method !== 'GET'){
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(response){
      // Cache successful responses
      if(response && response.status === 200 && response.type === 'basic'){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function(){
      // Offline fallback — serve cached version
      return caches.match(e.request).then(function(cached){
        if(cached) return cached;
        return caches.match('/skyflies-mobile-app/index.html');
      });
    })
  );
});
