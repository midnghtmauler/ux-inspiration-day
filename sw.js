/*
  Offline support for the Inspiration Day companion app (prototype).
  Precaches app files and shared Fabrik assets; serves network-first so edits
  appear on reload while online, falling back to the cache when offline.
  Bump CACHE whenever any precached file changes: the install fetch bypasses
  the HTTP cache, so a new version guarantees fresh copies on every client.
*/

var CACHE = 'uxday-v35';

var APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './icons.js',
  './content.js',
  './app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
  './assets/team/dirk.png',
  './assets/team/gasper.png',
  './assets/team/kate.png',
  './assets/team/lizhu.png',
  './assets/team/melanie.png',
  './assets/team/nicolas.png'
];

var SHARED_FILES = [
  './tokens.css',
  './components/button/button.css',
  './components/tag/tag.css',
  './components/paragraph/paragraph.css',
  './components/hyperlink/hyperlink.css',
  './utilities/fabrik-dropdown.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(APP_FILES.concat(SHARED_FILES).map(function (u) { return new Request(u, { cache: 'reload' }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
