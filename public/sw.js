// Manual service worker for GitHub Workflow Dashboard
// Handles caching and offline support

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`
const API_CACHE = `api-cache-${CACHE_VERSION}`

// Static assets to cache on install
const STATIC_ASSETS = [
	'/',
	'/manifest.json',
	'/icons/icon-192.svg',
	'/icons/icon-512.svg',
	'/icons/maskable-192.svg',
	'/icons/maskable-512.svg',
]

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(STATIC_CACHE).then(cache => {
			return cache.addAll(STATIC_ASSETS)
		}),
	)
	self.skipWaiting()
})

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
						return caches.delete(cacheName)
					}
				}),
			)
		}),
	)
	self.clientsClaim()
})

// Network first for API calls, cache first for static assets
self.addEventListener('fetch', event => {
	const {request} = event

	// Skip non-GET requests and browser extensions
	if (request.method !== 'GET') return
	if (!request.url.startsWith('http')) return

	const url = new URL(request.url)

	// GitHub API - network first with cache fallback
	if (url.hostname === 'api.github.com') {
		event.respondWith(
			fetch(request)
				.then(response => {
					const responseToCache = response.clone()
					caches.open(API_CACHE).then(cache => {
						cache.put(request, responseToCache)
					})
					return response
				})
				.catch(() => {
					return caches.match(request)
				}),
		)
		return
	}

	// Static assets - cache first with network fallback
	if (
		url.hostname === 'localhost' ||
		url.hostname === '127.0.0.1' ||
		request.url.includes('/_next/static/')
	) {
		event.respondWith(
			caches.match(request).then(cachedResponse => {
				if (cachedResponse) return cachedResponse
				return fetch(request).then(response => {
					const responseToCache = response.clone()
					caches.open(STATIC_CACHE).then(cache => {
						cache.put(request, responseToCache)
					})
					return response
				})
			}),
		)
		return
	}

	// Default - network first
	event.respondWith(
		fetch(request).catch(() => {
			return caches.match(request)
		}),
	)
})
