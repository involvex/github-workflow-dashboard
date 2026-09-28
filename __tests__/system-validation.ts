/**
 * Simple System Validation
 * Quick verification of key components
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

describe('System Validation', () => {
	test('Secure Storage Module should exist', async () => {
		const secureStorage = await import('../src/lib/storage/secure-storage')
		expect(secureStorage.setSecureItem).toBeDefined()
		expect(secureStorage.STORAGE_KEYS).toBeDefined()
		expect(typeof secureStorage.isSecureStorageAvailable).toBe('function')
	})

	test('GitHub API Client should exist', async () => {
		const githubApi = await import('../src/lib/api/github')
		expect(githubApi.GitHubApiClient).toBeDefined()
		expect(githubApi.GitHubApiError).toBeDefined()
	})

	test('Token Validation should exist', async () => {
		const tokenValidation = await import('../src/lib/api/token-validation')
		expect(typeof tokenValidation.validateGitHubToken).toBe('function')
	})

	test('TypeScript Types should be accessible', async () => {
		const types = await import('../src/lib/api/types')
		expect(typeof types).toBe('object')
	})

	test('GitHub Token Context should exist', async () => {
		const context = await import('../src/contexts/github-token-context')
		expect(context.GitHubTokenProvider).toBeDefined()
	})

	test('Main Page Component should exist', async () => {
		await import('../src/app/page')
		expect(true).toBe(true)
	})

	test('Settings Page Component should exist', async () => {
		await import('../src/app/settings/page')
		expect(true).toBe(true)
	})

	test('Layout Component should exist', async () => {
		await import('../src/app/layout')
		expect(true).toBe(true)
	})

	test('Critical Files Present', () => {
		const projectRoot = process.cwd()
		const criticalFiles = [
			'package.json',
			'next.config.js',
			'tsconfig.json',
			'src/app/page.tsx',
			'src/contexts/github-token-context.tsx',
			'src/lib/storage/secure-storage.ts',
		]

		let filesExist = 0
		for (const file of criticalFiles) {
			const exists = fs.existsSync(path.join(projectRoot, file))
			if (exists) filesExist++
		}

		expect(filesExist).toBe(criticalFiles.length)
	})
})
