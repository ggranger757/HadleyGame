/* TECHNOMANCERS — service worker: offline-first app shell.
   Bump VERSION whenever you change any file so players get the update. */
const VERSION = 'technomancers-v1.0.0';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/00-util.js', 'js/01-data.js', 'js/01b-story.js', 'js/01c-levels.js', 'js/02-state.js', 'js/03-input.js',
  'js/04-engine.js', 'js/05-render.js', 'js/06-player.js', 'js/07-ai.js', 'js/08-forensics.js', 'js/09-ui.js', 'js/10-main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
