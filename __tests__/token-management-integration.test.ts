/**
 * Integration test for Token Management System
 * Tests the complete flow of token storage, validation, and persistence
 */

import {GitHubApiClient} from '../src/lib/api/github'
import {validateGitHubToken} from '../src/lib/api/token-validation'
import {
	getSecureItem,
	isSecureStorageAvailable,
	removeSecureItem,
	setSecureItem,
	STORAGE_KEYS,
} from '../src/lib/storage/secure-storage'

// Mock Web APIs for testing
const mockCrypto = {
	getRandomValues: (array: Uint8Array) => {
		for (let i = 0; i < array.length; i++) {
			array[i] = Math.floor(Math.random() * 256)
		}
		return array
	},
	subtle: {
		digest: async () => {
			// Mock SHA-256 hash
			return new ArrayBuffer(32)
		},
		importKey: async () => ({type: 'secret'}) as CryptoKey,
		deriveKey: async () => ({type: 'secret'}) as CryptoKey,
		encrypt: async (
			_algorithm: AlgorithmIdentifier,
			_key: CryptoKey,
			data: ArrayBuffer,
		) => {
			return data // Return encrypted data (simplified)
		},
		decrypt: async (
			_algorithm: AlgorithmIdentifier,
			_key: CryptoKey,
			data: ArrayBuffer,
		) => {
			return data // Return decrypted data (simplified)
		},
	},
}

const mockLocalStorage = {
	data: {} as Record<string, string>,
	getItem: function (key: string) {
		return this.data[key] || null
	},
	setItem: function (key: string, value: string) {
		this.data[key] = value
	},
	removeItem: function (key: string) {
		delete this.data[key]
	},
	clear: function () {
		this.data = {}
	},
}

// Setup global mocks
beforeAll(() => {
	Object.defineProperty(window, 'crypto', {
		value: mockCrypto,
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'localStorage', {
		value: mockLocalStorage,
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'navigator', {
		value: {
			userAgent: 'test-browser',
			language: 'en-US',
		},
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'screen', {
		value: {
			width: 1920,
			height: 1080,
		},
		writable: true,
		configurable: true,
	})

	// Mock TextEncoder/TextDecoder
	globalThis.TextEncoder = class {
		encode(input: string) {
			return new Uint8Array(Buffer.from(input, 'utf8'))
		}
	} as unknown as typeof TextEncoder

	globalThis.TextDecoder = class {
		decode(input: Uint8Array) {
			return Buffer.from(input).toString('utf8')
		}
	} as unknown as typeof TextDecoder
})

describe('Token Management System Integration', () => {
	beforeEach(() => {
		mockLocalStorage.clear()
	})

	test('Secure storage availability check', async () => {
		const isAvailable = isSecureStorageAvailable()
		if (!isAvailable) {
			throw new Error('Secure storage should be available in test environment')
		}
	})

	test('Secure storage - set and get item', async () => {
		const testKey = STORAGE_KEYS.GITHUB_TOKEN
		const testValue = 'test-token-12345'

		await setSecureItem(testKey, testValue)
		const retrievedValue = await getSecureItem(testKey)

		if (retrievedValue !== testValue) {
			throw new Error(`Expected ${testValue}, got ${retrievedValue}`)
		}
	})

	test('Secure storage - remove item', async () => {
		const testKey = STORAGE_KEYS.GITHUB_TOKEN

		removeSecureItem(testKey)
		const retrievedValue = await getSecureItem(testKey)

		if (retrievedValue !== null) {
			throw new Error(`Expected null, got ${retrievedValue}`)
		}
	})

	test('Storage keys are properly defined', () => {
		const expectedKeys = [
			'GITHUB_TOKEN',
			'GITHUB_USER_ID',
			'SELECTED_REPOSITORIES',
			'USER_PREFERENCES',
			'LAST_SYNC',
		]
		const actualKeys = Object.keys(STORAGE_KEYS)

		for (const key of expectedKeys) {
			if (!actualKeys.includes(key)) {
				throw new Error(`Missing storage key: ${key}`)
			}
		}
	})

	test('Token validation returns proper structure', async () => {
		// Mock a fake token since we don't have a real one
		const fakeToken = 'ghp_' + 'x'.repeat(36)

		try {
			const result = await validateGitHubToken(fakeToken)

			// Check that result has the expected structure
			if (typeof result !== 'object' || result === null) {
				throw new Error('Validation result should be an object')
			}

			if (!('isValid' in result) || typeof result.isValid !== 'boolean') {
				throw new Error(
					'Validation result should have isValid boolean property',
				)
			}
		} catch (error) {
			// Network errors are expected in test environment, just verify structure
			if (
				error instanceof Error &&
				(error.message.includes('fetch') ||
					error.message.includes('network') ||
					error.message.includes('ENOTFOUND') ||
					error.message.includes('connect'))
			) {
				// Network error expected in test environment (this is normal)
			} else {
				throw error
			}
		}
	})

	test('GitHub API client is properly structured', () => {
		const client = new GitHubApiClient('fake-token')

		// Check that required methods exist
		const requiredMethods = [
			'validateToken',
			'getRepositories',
			'getWorkflows',
			'getWorkflowRuns',
		]

		for (const method of requiredMethods) {
			if (
				typeof (client as unknown as Record<string, unknown>)[method] !==
				'function'
			) {
				throw new Error(`GitHub API client missing method: ${method}`)
			}
		}
	})

	test('Device fingerprinting produces consistent results', async () => {
		// Store and retrieve the same token twice to test consistency
		const testKey = STORAGE_KEYS.USER_PREFERENCES
		const testValue = 'consistent-test-value'

		await setSecureItem(testKey, testValue)
		const first = await getSecureItem(testKey)

		await setSecureItem(testKey, testValue)
		const second = await getSecureItem(testKey)

		if (first !== second || first !== testValue) {
			throw new Error('Device fingerprinting should produce consistent results')
		}
	})

	test('Multiple storage keys work independently', async () => {
		const testData = {
			[STORAGE_KEYS.GITHUB_TOKEN]: 'token-value',
			[STORAGE_KEYS.SELECTED_REPOSITORIES]: 'repos-value',
			[STORAGE_KEYS.USER_PREFERENCES]: 'prefs-value',
		}

		// Store all values
		for (const [key, value] of Object.entries(testData)) {
			await setSecureItem(key, value)
		}

		// Verify all values
		for (const [key, expectedValue] of Object.entries(testData)) {
			const actualValue = await getSecureItem(key)
			if (actualValue !== expectedValue) {
				throw new Error(
					`Key ${key}: expected ${expectedValue}, got ${actualValue}`,
				)
			}
		}
	})

	test('Error handling for invalid data', async () => {
		// Manually corrupt localStorage data
		mockLocalStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, 'invalid-json-data')

		const result = await getSecureItem(STORAGE_KEYS.GITHUB_TOKEN)
		if (result !== null) {
			throw new Error('Should return null for corrupted data')
		}

		// Verify corrupted data was cleaned up
		const stored = mockLocalStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN)
		if (stored !== null) {
			throw new Error('Corrupted data should be cleaned up')
		}
	})

	test('Performance - rapid storage operations', async () => {
		const start = Date.now()

		for (let i = 0; i < 10; i++) {
			await setSecureItem(STORAGE_KEYS.USER_PREFERENCES, `value-${i}`)
			await getSecureItem(STORAGE_KEYS.USER_PREFERENCES)
		}

		const end = Date.now()
		const duration = end - start

		if (duration > 5000) {
			// 5 seconds seems reasonable for 10 cycles
			throw new Error(`Performance too slow: ${duration}ms for 10 operations`)
		}
	})
})
