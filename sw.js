// ══════════════════════════════════════════
//  BASAR APP — Service Worker (PWA)
//  بصر — خدمة العمل بدون اتصال
// ══════════════════════════════════════════

const CACHE_NAME = 'basar-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// ── Install: cache core assets ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // cache local assets first (external may fail)
      return cache.addAll(['/', '/index.html']).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network first, fallback to cache ──
self.addEventListener('fetch', e => {
  // Skip non-GET and Supabase API calls (always need fresh data)
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses
        if(response && response.status === 200 && response.type !== 'opaque'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // Fallback to index.html for navigation requests
          if(e.request.mode === 'navigate'){
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ── Push Notifications (future use) ──
self.addEventListener('push', e => {
  if(!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'بصر', {
    body: data.body || '',
    icon: '/manifest.json',
    badge: '/manifest.json',
    dir: 'rtl',
    lang: 'ar',
    tag: 'basar-notification'
  });
});
