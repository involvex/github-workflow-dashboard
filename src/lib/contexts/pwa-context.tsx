'use client'

import {notificationStorage} from '@/lib/storage/notification-storage'
import {createContext, ReactNode, useContext, useEffect, useState} from 'react'

export interface PWAFeatures {
	installed: boolean
	canInstall: boolean
	online: boolean
	notifications: boolean
	notificationsEnabled: boolean
}

interface PWAContextType {
	features: PWAFeatures
	enableNotifications: () => Promise<void>
	disableNotifications: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({children}: {children: ReactNode}) {
	const [features, setFeatures] = useState<PWAFeatures>({
		installed: false,
		canInstall: false,
		online: typeof navigator !== 'undefined' ? navigator.onLine : true,
		notifications: false,
		notificationsEnabled: false,
	})

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleOnline = () => {
			setFeatures(prev => ({...prev, online: true}))
		}

		const handleOffline = () => {
			setFeatures(prev => ({...prev, online: false}))
		}

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		if (window.navigator?.serviceWorker) {
			window.navigator.serviceWorker.ready.then(registration => {
				setFeatures(prev => ({
					...prev,
					installed: !!registration,
				}))
			})
		}

		setFeatures(prev => ({
			...prev,
			canInstall: 'BeforeInstallPromptEvent' in window,
		}))

		const enabled = notificationStorage.isEnabled()
		setFeatures(prev => ({
			...prev,
			notifications: true,
			notificationsEnabled: enabled,
		}))

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	const enableNotifications = async () => {
		if (!('Notification' in window)) return

		const permission = await Notification.requestPermission()
		if (permission === 'granted') {
			notificationStorage.setEnabled(true)
			setFeatures(prev => ({
				...prev,
				notificationsEnabled: true,
			}))
		}
	}

	const disableNotifications = () => {
		notificationStorage.setEnabled(false)
		setFeatures(prev => ({
			...prev,
			notificationsEnabled: false,
		}))
	}

	return (
		<PWAContext.Provider
			value={{features, enableNotifications, disableNotifications}}
		>
			{children}
		</PWAContext.Provider>
	)
}

export function usePWA() {
	const context = useContext(PWAContext)
	if (!context) {
		throw new Error('usePWA must be used within PWAProvider')
	}
	return context
}
