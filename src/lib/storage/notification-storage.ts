const NOTIFICATION_STORAGE_KEY = 'github-workflows-notifications-enabled'

export const notificationStorage = {
	isEnabled: (): boolean => {
		if (typeof localStorage === 'undefined') return false
		const value = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
		return value === 'true'
	},

	setEnabled: (enabled: boolean): void => {
		if (typeof localStorage === 'undefined') return
		localStorage.setItem(NOTIFICATION_STORAGE_KEY, String(enabled))
	},

	clear: (): void => {
		if (typeof localStorage === 'undefined') return
		localStorage.removeItem(NOTIFICATION_STORAGE_KEY)
	},
}
