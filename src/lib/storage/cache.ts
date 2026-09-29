import type {GitHubWorkflowRun, Repository} from '@/lib/api/types'

const DB_NAME = 'github-workflow-dashboard'
const DB_VERSION = 1

const STORES = {
	WORKFLOWS: 'workflows',
	REPOSITORIES: 'repositories',
	METADATA: 'metadata',
} as const

interface CachedWorkflow {
	repositoryId: number
	workflowId: number
	data: GitHubWorkflowRun
	timestamp: number
}

interface CachedRepository {
	repositoryId: number
	data: Repository
	timestamp: number
}

class IndexedDBCache {
	private db: IDBDatabase | null = null
	private isInitialized = false

	private async init(): Promise<void> {
		if (this.isInitialized) return

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION)

			request.onerror = () => {
				console.error('IndexedDB failed to open')
				reject(new Error('IndexedDB failed to open'))
			}

			request.onsuccess = event => {
				this.db = (event.target as IDBOpenDBRequest).result
				this.isInitialized = true
				resolve()
			}

			request.onupgradeneeded = event => {
				const db = (event.target as IDBOpenDBRequest).result

				if (!db.objectStoreNames.contains(STORES.WORKFLOWS)) {
					const workflowStore = db.createObjectStore(STORES.WORKFLOWS, {
						keyPath: 'workflowId',
					})
					workflowStore.createIndex('repositoryId', 'repositoryId', {
						unique: false,
					})
					workflowStore.createIndex('timestamp', 'timestamp', {unique: false})
				}

				if (!db.objectStoreNames.contains(STORES.REPOSITORIES)) {
					const repoStore = db.createObjectStore(STORES.REPOSITORIES, {
						keyPath: 'repositoryId',
					})
					repoStore.createIndex('repositoryId', 'repositoryId', {unique: false})
					repoStore.createIndex('timestamp', 'timestamp', {unique: false})
				}

				if (!db.objectStoreNames.contains(STORES.METADATA)) {
					const metaStore = db.createObjectStore(STORES.METADATA, {
						keyPath: 'key',
					})
					metaStore.createIndex('timestamp', 'timestamp', {unique: false})
				}
			}
		})
	}

	async getWorkflowByRepo(
		repositoryId: number,
	): Promise<CachedWorkflow[] | null> {
		await this.init()
		if (!this.db) return null

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORES.WORKFLOWS], 'readonly')
			const store = transaction.objectStore(STORES.WORKFLOWS)
			const index = store.index('repositoryId')
			const request = index.getAll(IDBKeyRange.only(repositoryId))

			request.onsuccess = () => {
				resolve(request.result)
			}

			request.onerror = () => {
				console.error('Failed to get workflows from cache')
				reject(request.error)
			}
		})
	}

	async getWorkflow(
		repositoryId: number,
		workflowId: number,
	): Promise<CachedWorkflow | null> {
		await this.init()
		if (!this.db) return null

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORES.WORKFLOWS], 'readonly')
			const store = transaction.objectStore(STORES.WORKFLOWS)
			const request = store.get(workflowId)

			request.onsuccess = () => {
				const result = request.result
				if (result && result.repositoryId === repositoryId) {
					resolve(result)
				} else {
					resolve(null)
				}
			}

			request.onerror = () => {
				console.error('Failed to get workflow from cache')
				reject(request.error)
			}
		})
	}

	async setWorkflows(
		repositoryId: number,
		workflowRuns: GitHubWorkflowRun[],
	): Promise<void> {
		await this.init()
		if (!this.db) return

		const timestamp = Date.now()

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORES.WORKFLOWS], 'readwrite')
			const store = transaction.objectStore(STORES.WORKFLOWS)

			for (const run of workflowRuns) {
				const cached: CachedWorkflow = {
					repositoryId,
					workflowId: run.id,
					data: run,
					timestamp,
				}
				store.put(cached)
			}

			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error)
		})
	}

	async getRepository(repositoryId: number): Promise<CachedRepository | null> {
		await this.init()
		if (!this.db) return null

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[STORES.REPOSITORIES],
				'readonly',
			)
			const store = transaction.objectStore(STORES.REPOSITORIES)
			const request = store.get(repositoryId)

			request.onsuccess = () => {
				resolve(request.result)
			}

			request.onerror = () => {
				console.error('Failed to get repository from cache')
				reject(request.error)
			}
		})
	}

	async setRepository(repository: Repository): Promise<void> {
		await this.init()
		if (!this.db) return

		const cached: CachedRepository = {
			repositoryId: repository.id,
			data: repository,
			timestamp: Date.now(),
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				[STORES.REPOSITORIES],
				'readwrite',
			)
			const store = transaction.objectStore(STORES.REPOSITORIES)
			store.put(cached)

			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error)
		})
	}

	async clearWorkflows(repositoryId?: number): Promise<void> {
		await this.init()
		if (!this.db) return

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORES.WORKFLOWS], 'readwrite')
			const store = transaction.objectStore(STORES.WORKFLOWS)

			if (repositoryId !== undefined) {
				const index = store.index('repositoryId')
				const cursorRequest = index.openCursor()

				cursorRequest.onsuccess = () => {
					const cursor = cursorRequest.result
					if (cursor) {
						if (cursor.value.repositoryId === repositoryId) {
							cursor.delete()
						}
						cursor.continue()
					}
				}
			} else {
				store.clear()
			}

			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error)
		})
	}

	async clearAll(): Promise<void> {
		await this.init()
		if (!this.db) return

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(
				['workflows', 'repositories', 'metadata'],
				'readwrite',
			)

			transaction.objectStore('workflows').clear()
			transaction.objectStore('repositories').clear()
			transaction.objectStore('metadata').clear()

			transaction.oncomplete = () => resolve()
			transaction.onerror = () => reject(transaction.error)
		})
	}
}

export const cache = new IndexedDBCache()

export async function getCachedWorkflowsByRepo(
	repositoryId: number,
): Promise<CachedWorkflow[] | null> {
	return cache.getWorkflowByRepo(repositoryId)
}

export async function setCachedWorkflows(
	repositoryId: number,
	workflowRuns: GitHubWorkflowRun[],
): Promise<void> {
	return cache.setWorkflows(repositoryId, workflowRuns)
}
