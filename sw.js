/* Service Worker PAMSIMAS — menyimpan aplikasi agar bisa dibuka offline.
   Strategi: precache app-shell saat install, cache-first saat fetch,
   plus cache runtime untuk skrip SheetJS dari CDN. */

const VERSION = 'pamsimas-v5';

const APP_SHELL = [
  './',
  './index.html',
  './css/splash.css',
  './css/base.css',
  './css/header.css',
  './css/buttons.css',
  './css/forms.css',
  './css/result.css',
  './css/history.css',
  './css/footer.css',
  './css/toast.css',
  './css/themes.css',
  './css/print.css',
  './js/splash.js',
  './js/config.js',
  './js/calculator.js',
  './js/storage.js',
  './js/export.js',
  './js/receipt.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg'
];

// Pasang: simpan app shell ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Aktifkan: buang cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first, lalu jaringan; jaringan untuk permintaan non-GET
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Simpan salinan respons asal (termasuk dari CDN) ke cache runtime
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        // Offline dan tidak ada di cache: halaman navigasi → shell aplikasi
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
