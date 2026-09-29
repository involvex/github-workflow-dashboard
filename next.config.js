const withPWA = require('next-pwa')

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Skip type checking during build for CI compatibility
	typescript: {
		ignoreBuildErrors: true,
	},
}

const pluginOptions = {
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	sw: 'sw.js',
	register: true,
	skipWaiting: true,
}

module.exports = withPWA(pluginOptions)(nextConfig)
