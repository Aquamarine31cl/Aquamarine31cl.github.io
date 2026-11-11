'use strict';

const release = '87';
const scope = new URL(self.registration.scope);
const prefix = 'star-arcade:' + scope.pathname + ':';
const cacheName = prefix + release;
const games = [
  'voidrunner/', 'relay-siege/', 'helios-accord/', 'kepler-courier/', 'meridian-fleet/',
  'cargo-lock/', 'signal-lattice/', 'shadow-dock/', 'gravimetric-survey/'
];
const assets = [
  '../assets/css/star-arcade.css', '../assets/css/arcade-app.css', '../assets/css/voidrunner.css',
  '../assets/css/helios.css', '../assets/css/grid-missions.css',
  '../assets/js/arcade-app.js', '../assets/js/arcade-progress.js', '../assets/js/campaign-controls.js',
  '../assets/js/voidrunner-engine.js', '../assets/js/voidrunner.js', '../assets/js/relay-siege.js',
  '../assets/js/helios-engine.js', '../assets/js/helios.js', '../assets/js/kepler-courier.js',
  '../assets/js/meridian-fleet.js', '../assets/js/grid-mission-stages.js', '../assets/js/grid-missions.js'
].map(path => path + '?v=' + release);
const pages = new Set(['./', ...games].map(path => new URL(path, scope).href));
const resources = new Set([...assets, 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']
  .map(path => new URL(path, scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    const urls = [...pages, ...resources].map(url => new Request(url, {cache: 'reload'}));
    await cache.addAll(urls);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== scope.origin) return;

  let key = url.href;
  if (event.request.mode === 'navigate') {
    url.search = '';
    url.pathname = url.pathname.replace(/\/index\.html$/, '/');
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    key = url.href;
    if (!pages.has(key)) return;
  } else if (!resources.has(key)) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(key) ?? fetch(event.request);
  })());
});
