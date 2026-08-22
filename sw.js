/* Jovi Greene Tour — service worker.
   Caches the app shell so the app launches instantly (and offline).
   Live data has its own localStorage cache inside the app, so API calls stay network-only. */

var CACHE = 'jg-shell-v1';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // API + external links: straight to network
  // Shell: serve from cache immediately, refresh the cache in the background
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fresh = fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || fresh;
    })
  );
});
