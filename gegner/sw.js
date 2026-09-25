/* Service Worker fuer /gegner/ - Offline-Unterstuetzung fuer Spaziergaenge.
   Handgeschrieben, wird NICHT vom Content-Build ueberschrieben.

   Bekannte Einschraenkungen:
   - Nur online besuchte Analyse-Seiten sind offline verfuegbar (kein
     automatisches Vor-Cachen aller content/*.md-Ergebnisse).
   - Browser cachen sw.js selbst bis zu ~24h lang, bevor ein Update dieser
     Datei bemerkt wird - Analyse-Inhalte selbst aktualisieren sich davon
     unabhaengig bei jedem Online-Besuch (stale-while-revalidate).
   - Bei knappem Geraetespeicher kann der Cache vom Browser geleert werden.
   - Setzt HTTPS voraus (bei *.github.io bereits gegeben).
*/
'use strict';

var SHELL_CACHE = 'gegner-shell-v1';
var PAGES_CACHE = 'gegner-pages';
var SHELL_FILES = ['index.html', 'offline.html', 'css/gegner.css', 'js/gegner.js', 'manifest.webmanifest'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  var keep = [SHELL_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return keep.indexOf(key) === -1; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

function isIndexRequest(url) {
  return url.pathname.endsWith('/index.html') || url.pathname.endsWith('/gegner/');
}

/* network-first: online = frisch + cachen, offline = letzte bekannte Version */
function networkFirst(request) {
  return fetch(request)
    .then(function (response) {
      var copy = response.clone();
      caches.open(PAGES_CACHE).then(function (cache) { cache.put(request, copy); });
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match('offline.html');
      });
    });
}

/* stale-while-revalidate: sofort aus Cache, im Hintergrund aktualisieren */
function staleWhileRevalidate(request) {
  return caches.match(request).then(function (cached) {
    var network = fetch(request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(PAGES_CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      })
      .catch(function () { return null; });
    return cached || network.then(function (r) { return r || caches.match('offline.html'); });
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      var copy = response.clone();
      caches.open(SHELL_CACHE).then(function (cache) { cache.put(request, copy); });
      return response;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    if (isIndexRequest(url)) {
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  if (SHELL_FILES.some(function (f) { return url.pathname.endsWith('/' + f); })) {
    event.respondWith(cacheFirst(request));
  }
});
