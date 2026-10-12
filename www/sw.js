// Service worker for the website version: makes it work offline once opened.
// App files: network first (updates show up right away), cache as fallback.
// Bundled libraries (vendor/, incl. the ~14 MB label reader): cached the first time they're used.
// Bump VERSION when you change files.
const VERSION = 'board-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/fonts.css', './css/styles.css',
  './js/storage.js', './js/plan.js', './js/backup.js', './js/ocr.js', './js/food.js', './js/app.js', './js/pwa.js',
  './vendor/capacitor.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== VERSION && k !== 'board-vendor').map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/vendor/')) {
    // cache first: these files never change for a given app version
    e.respondWith(caches.open('board-vendor').then(c => c.match(req).then(hit => hit ||
      fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
