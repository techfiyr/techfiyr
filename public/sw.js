/*
 * Service worker for techfiyr.com (registered by components/SiteRuntime.tsx in production).
 * Makes the site an installable PWA, keeps repeat visits instant and lets visited pages open offline.
 *
 *   /_next/static/*, /assets/*, Google Fonts   cache first (file names or ?v= change when content does)
 *   pages and Next.js page data (RSC)          network first, saved copy if the network is slow or down
 *   /media/* (CMS images, unique names)        cache first
 *   anything else (/admin, /api/*, analytics,  not touched
 *   Google Maps, other sites, POST requests)
 *
 * Bump VERSION when this file's caching rules change; old caches are deleted on activate.
 */
'use strict';

var VERSION = '2026-10-18.2';
var STATIC_CACHE = 'techfiyr-static-' + VERSION;
var PAGE_CACHE = 'techfiyr-pages-' + VERSION;  // HTML documents only
var DATA_CACHE = 'techfiyr-data-' + VERSION;   // Next.js page data for client-side navigation
var OFFLINE_URL = '/offline';
var PRECACHE_PAGES = ['/', '/projects', '/contact', OFFLINE_URL];
var NETWORK_TIMEOUT_MS = 3000;
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(PAGE_CACHE)
			.then(function (cache) { return cache.addAll(PRECACHE_PAGES); })
			.then(function () { return self.skipWaiting(); })
	);
});

self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys()
			.then(function (keys) {
				return Promise.all(keys.filter(function (k) {
					return k.indexOf('techfiyr-') === 0 && [STATIC_CACHE, PAGE_CACHE, DATA_CACHE].indexOf(k) < 0;
				}).map(function (k) { return caches.delete(k); }));
			})
			.then(function () { return self.clients.claim(); })
	);
});

// The page sends the files it loaded before this worker was in control, so they work offline too
self.addEventListener('message', function (event) {
	var data = event.data || {};
	if (data.type !== 'warm' || !Array.isArray(data.urls)) return;
	var urls = data.urls.filter(function (u) { return isStatic(new URL(u, self.location.origin)); });
	event.waitUntil(caches.open(STATIC_CACHE).then(function (cache) {
		return Promise.all(urls.map(function (u) {
			return cache.match(u).then(function (hit) {
				if (hit) return;
				return fetch(u, { mode: FONT_HOSTS.indexOf(new URL(u).hostname) > -1 ? 'cors' : 'same-origin' })
					.then(function (res) { if (res.ok) return cache.put(u, res); })
					.catch(function () {});
			});
		}));
	}));
});

function isStatic(url) {
	if (FONT_HOSTS.indexOf(url.hostname) > -1) return true;
	if (url.origin !== self.location.origin) return false;
	return url.pathname.indexOf('/_next/static/') === 0 || url.pathname.indexOf('/assets/') === 0 || url.pathname.indexOf('/media/') === 0;
}

function isPageData(request, url) {
	return url.origin === self.location.origin && (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc'));
}

function cacheFirst(request) {
	return caches.open(STATIC_CACHE).then(function (cache) {
		return cache.match(request).then(function (hit) {
			if (hit) return hit;
			return fetch(request).then(function (res) {
				if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
				return res;
			});
		});
	});
}

// Network first, but don't keep the visitor waiting on a slow connection when a saved copy exists.
// Pages are saved under their address without the query string, page data under the full address.
function networkFirst(request, cacheName, fallbackUrl) {
	var isPage = request.mode === 'navigate';
	var key = isPage ? new URL(request.url).pathname : request;
	return caches.open(cacheName).then(function (cache) {
		var network = fetch(request).then(function (res) {
			if (res.ok && res.type === 'basic') cache.put(key, res.clone());
			return res;
		});
		network.catch(function () {}); // a failure is handled below; this only silences the background copy
		var saved = cache.match(key, { ignoreVary: true });
		var timeout = new Promise(function (resolve) { setTimeout(resolve, NETWORK_TIMEOUT_MS); });

		return Promise.race([network, timeout.then(function () { return saved; })])
			.then(function (res) { return res || network; })
			.catch(function () {
				return saved.then(function (hit) {
					if (hit) return hit;
					return fallbackUrl ? cache.match(fallbackUrl) : Response.error();
				});
			})
			.then(function (res) { return res || Response.error(); });
	});
}

self.addEventListener('fetch', function (event) {
	var request = event.request;
	if (request.method !== 'GET') return;
	var url = new URL(request.url);

	if (isStatic(url)) {
		event.respondWith(cacheFirst(request));
		return;
	}
	// the admin panel is private and always live: never cached
	if (url.origin !== self.location.origin || url.pathname.indexOf('/api/') === 0 || url.pathname.indexOf('/admin') === 0) return;

	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request, PAGE_CACHE, OFFLINE_URL));
		return;
	}
	if (isPageData(request, url)) {
		event.respondWith(networkFirst(request, DATA_CACHE, null));
	}
});
