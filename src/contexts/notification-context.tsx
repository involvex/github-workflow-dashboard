/**
 * Notification Context
 * Manages notification preferences and local notifications
 */
'use client'

import {createContext, ReactNode, useContext, useEffect, useState} from 'react'

export type NotificationType =
	| 'workflow-failure'
	| 'workflow-success'
	| 'rate-limit'
	| 'workflow-complete'
	| 'connection-lost'

export interface NotificationRule {
	id: string
	type: NotificationType
	enabled: boolean
}

interface NotificationContextType {
	notificationsEnabled: boolean
	setNotificationsEnabled: (enabled: boolean) => void
	rules: NotificationRule[]
	addRule: (type: NotificationType) => void
	removeRule: (id: string) => void
	showLocalNotification: (type: NotificationType, message: string) => void
	requestPushPermission: () => Promise<boolean>
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined,
)

const DEFAULT_RULES: NotificationRule[] = [
	{id: 'workflow-failure', type: 'workflow-failure', enabled: true},
]

export function NotificationProvider({children}: {children: ReactNode}) {
	const [notificationsEnabled, setNotificationsEnabled] = useState(true)
	const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES)

	useEffect(() => {
		const enabled = localStorage.getItem('github-notifications-enabled')
		if (enabled !== null) {
			setNotificationsEnabled(enabled === 'true')
		}

		const storedRules = localStorage.getItem('github-notification-rules')
		if (storedRules) {
			try {
				setRules(JSON.parse(storedRules))
			} catch {
				// Use defaults
			}
		}
	}, [])

	useEffect(() => {
		localStorage.setItem(
			'github-notifications-enabled',
			String(notificationsEnabled),
		)
	}, [notificationsEnabled])

	useEffect(() => {
		localStorage.setItem('github-notification-rules', JSON.stringify(rules))
	}, [rules])

	const showLocalNotification = (type: NotificationType, message: string) => {
		if (!notificationsEnabled) return

		if ('Notification' in window && Notification.permission === 'granted') {
			new Notification('GitHub Workflow Dashboard', {
				body: message,
				icon: '/icons/icon-192.svg',
			})
		}
	}

	const requestPushPermission = async (): Promise<boolean> => {
		if (!('Notification' in window)) return false

		const permission = await Notification.requestPermission()
		return permission === 'granted'
	}

	const addRule = (type: NotificationType) => {
		const newRule: NotificationRule = {
			id: `${type}-${Date.now()}`,
			type,
			enabled: true,
		}
		setRules([...rules, newRule])
	}

	const removeRule = (id: string) => {
		setRules(rules.filter(r => r.id !== id))
	}

	return (
		<NotificationContext.Provider
			value={{
				notificationsEnabled,
				setNotificationsEnabled,
				rules,
				addRule,
				removeRule,
				showLocalNotification,
				requestPushPermission,
			}}
		>
			{children}
		</NotificationContext.Provider>
	)
}

export function useNotifications() {
	const context = useContext(NotificationContext)
	if (!context) {
		throw new Error('useNotifications must be used within NotificationProvider')
	}
	return context
}
