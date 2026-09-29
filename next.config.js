const withPWA = require('next-pwa')

/** @type {import('next').NextConfig} */
const nextConfig = {}

const pluginOptions = {
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	sw: 'sw.js',
	register: true,
	skipWaiting: true,
}

module.exports = withPWA(pluginOptions)(nextConfig)
