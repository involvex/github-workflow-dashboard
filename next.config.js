const {defineConfig} = require('next-pwa')

/** @type {import('next').NextConfig */
const nextConfig = {}

module.exports = defineConfig({
	dest: 'public',
	cacheOnEdge: true,
	disable: process.env.NODE_ENV === 'development',
	sw: 'sw.js',
	register: true,
	skipWaiting: true,
	runtimeCaching: [
		{
			urlPattern: /^https:\/\/api\.github\.com\/.*/u,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'github-api',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 300,
				},
				networkTimeoutSeconds: 10,
			},
		},
		{
			urlPattern: /\.(?:png|jpg|jpeg|svg|ico|webp|css|js|json)$/u,
			handler: 'CacheFirst',
			options: {
				cacheName: 'static-assets',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 31 * 24 * 60 * 60,
				},
			},
		},
	],
})(nextConfig)
