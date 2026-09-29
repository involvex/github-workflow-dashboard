/**
 * VAPID Keys Configuration for Push Notifications
 *
 * These keys are used for push notifications via the Web Push protocol.
 * Generated using: npx web-push generate-vapid-keys --json
 *
 * For production use, keep the private key secret!
 *
 * Usage:
 * - Public key is used client-side for subscription
 * - Private key is used server-side to send notifications
 *
 * IMPORTANT: In production, store the private key in an environment variable
 * or secure server configuration. Never commit the private key to version control.
 */

// Production VAPID keys
export const VAPID_PUBLIC_KEY =
	'BJP2ZRvKECUYm7a8MX70Oqf8yu5-9VY50i59Jm-kHyeQn2mqjdWzppcpK9t3z5gTTjAI97Smqx-nERYh_MqPkwI'

// Secret - DO NOT COMMIT TO VERSION CONTROL IN PRODUCTION
// This should be stored in an environment variable
export const VAPID_PRIVATE_KEY = 'p3o3sFABUZUY6Ci2Ytnye91q3QBIwmoaEhPxfjgJOLg'

/**
 * Converts a base64url encoded string to Uint8Array
 * @param base64String - The base64url encoded string
 * @returns Uint8Array for use with Web APIs
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

	const rawData = atob(base64)
	const outputArray = new Uint8Array(rawData.length)

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}

	return outputArray
}
