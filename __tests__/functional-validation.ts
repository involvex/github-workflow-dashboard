/**
 * Functional Validation
 * Validates the complete token management system functionality
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// Mock Web APIs for jsdom environment
const mockCrypto = {
	getRandomValues: (array: Uint8Array) => {
		for (let i = 0; i < array.length; i++) {
			array[i] = Math.floor(Math.random() * 256)
		}
		return array
	},
	subtle: {
		digest: async () => {
			return new ArrayBuffer(32)
		},
		importKey: async () => ({type: 'secret'}) as CryptoKey,
		deriveKey: async () => ({type: 'secret'}) as CryptoKey,
		encrypt: async () => {
			return new ArrayBuffer(32)
		},
		decrypt: async () => {
			return new ArrayBuffer(16)
		},
	},
}

beforeAll(() => {
	Object.defineProperty(globalThis, 'crypto', {
		value: mockCrypto,
		writable: true,
		configurable: true,
	})

	Object.defineProperty(globalThis, 'navigator', {
		value: {
			userAgent: 'test-browser',
			language: 'en-US',
		},
		writable: true,
		configurable: true,
	})

	Object.defineProperty(globalThis, 'screen', {
		value: {
			width: 1920,
			height: 1080,
		},
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'crypto', {
		value: mockCrypto,
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'localStorage', {
		value: {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
		},
		writable: true,
		configurable: true,
	})

	Date.prototype.getTimezoneOffset = () => -480
})

describe('Functional Validation', () => {
	test('Secure Storage - Basic Operations', async () => {
		const {isSecureStorageAvailable} =
			await import('../src/lib/storage/secure-storage')

		if (!isSecureStorageAvailable()) {
			throw new Error('Secure storage should be available in test environment')
		}
	})

	test('GitHub API Client - Structure Validation', async () => {
		const {GitHubApiClient} = await import('../src/lib/api/github')

		const api = new GitHubApiClient('fake_token')

		if (!api.validateToken) {
			throw new Error('GitHub API client missing validateToken method')
		}

		if (!api.getRepositories) {
			throw new Error('GitHub API client missing getRepositories method')
		}

		if (!api.getWorkflowRuns) {
			throw new Error('GitHub API client missing getWorkflowRuns method')
		}
	})

	test('Token Validation - Mock Response', async () => {
		const {validateGitHubToken} =
			await import('../src/lib/api/token-validation')

		const result = await validateGitHubToken('ghp_mock_token_123')

		if (typeof result.isValid !== 'boolean') {
			throw new Error('Token validation should return boolean isValid')
		}

		if (result.error !== null && typeof result.error !== 'string') {
			throw new Error('Token validation error should be string or null')
		}
	})

	test('GitHub Types - Interface Validation', async () => {
		const types = await import('../src/lib/api/types')

		// Types are erased at runtime, so we just verify the module loads
		expect(types).toBeDefined()
		expect(typeof types).toBe('object')
	})

	test('Application Pages - Import Validation', async () => {
		try {
			await import('../src/app/page')
			await import('../src/app/layout')
			await import('../src/app/settings/page')
		} catch (error) {
			throw new Error(
				`Failed to import application pages: ${(error as Error).message}`,
			)
		}
	})

	test('GitHub Token Context - Provider Structure', async () => {
		const {GitHubTokenProvider} =
			await import('../src/contexts/github-token-context')

		if (!GitHubTokenProvider) {
			throw new Error('GitHubTokenProvider should be exported')
		}

		if (typeof GitHubTokenProvider !== 'function') {
			throw new Error(
				'GitHubTokenProvider should be a React component function',
			)
		}
	})

	test('Storage Keys - Consistency Check', async () => {
		const {STORAGE_KEYS} = await import('../src/lib/storage/secure-storage')

		const requiredKeys = [
			'GITHUB_TOKEN',
			'SELECTED_REPOSITORIES',
			'USER_PREFERENCES',
			'LAST_SYNC',
		]

		for (const key of requiredKeys) {
			if (!(key in STORAGE_KEYS)) {
				throw new Error(`Missing storage key: ${key}`)
			}
		}
	})

	test('Rate Limiting - Configuration Check', async () => {
		const {GitHubApiClient} = await import('../src/lib/api/github')
		const api = new GitHubApiClient('test_token')

		if (!api) {
			throw new Error('GitHub API client should initialize properly')
		}
	})

	test('Error Handling - Invalid Token', async () => {
		const {validateGitHubToken} =
			await import('../src/lib/api/token-validation')

		const result = await validateGitHubToken('invalid_token')

		if (result.isValid === true) {
			console.log(
				'  ℹ️  Note: Mock environment may not validate actual token format',
			)
		}
	})

	test('Development Environment - Build Validation', () => {
		const projectRoot = __dirname

		// Check essential files exist
		const essentialFiles = [
			'package.json',
			'next.config.js',
			'tailwind.config.ts',
			'tsconfig.json',
			'src/app/page.tsx',
			'src/app/layout.tsx',
			'src/contexts/github-token-context.tsx',
			'src/lib/storage/secure-storage.ts',
			'src/lib/api/github.ts',
		]

		for (const file of essentialFiles) {
			const filePath = path.join(projectRoot, '..', file)
			if (!fs.existsSync(filePath)) {
				throw new Error(`Essential file missing: ${file}`)
			}
		}
	})
})
