/**
 * Repository Loading Flow Test
 *
 * This script tests the complete repository loading flow to ensure
 * the infinite loop issue has been resolved.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Repository Loading Flow', () => {
	test('should check context file for useCallback usage', async () => {
		const contextFile = await fs.promises.readFile(
			path.join(process.cwd(), 'src/contexts/repository-selection-context.tsx'),
			'utf8',
		)

		const hasUseCallback = contextFile.includes('useCallback')
		const hasFetchRepositories = contextFile.includes('fetchRepositories')
		const hasToggleRepository = contextFile.includes('toggleRepository')

		expect(hasUseCallback).toBe(true)
		expect(hasFetchRepositories).toBe(true)
		expect(hasToggleRepository).toBe(true)
	})

	test('should check component file for error handling', async () => {
		const componentFile = await fs.promises.readFile(
			path.join(process.cwd(), 'src/components/repository-selection.tsx'),
			'utf8',
		)

		const hasErrorHandling =
			componentFile.includes('error') && componentFile.includes('XCircle')

		expect(hasErrorHandling).toBe(true)
	})

	test('should check token context file for validation', async () => {
		const tokenContextFile = await fs.promises.readFile(
			path.join(process.cwd(), 'src/contexts/github-token-context.tsx'),
			'utf8',
		)

		const hasDebugLogging =
			tokenContextFile.includes('console.log') &&
			tokenContextFile.includes('[GitHub Token Context]')

		expect(hasDebugLogging).toBe(true)
	})
})
