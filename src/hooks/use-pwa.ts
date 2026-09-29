'use client'

import {useEffect, useState} from 'react'

export function useServiceWorkerRegistration() {
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null)
	const [isReady, setIsReady] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (typeof window === 'undefined' || !window.navigator?.serviceWorker) {
			return
		}

		const registerSW = async () => {
			try {
				const registration = await window.navigator.serviceWorker.register(
					'/sw.js',
					{
						scope: '/',
					},
				)
				setRegistration(registration)
				setIsReady(true)

				// Check for updates
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (
								newWorker.state === 'installed' &&
								navigator.serviceWorker.controller
							) {
								// New version available, could show update prompt
							}
						})
					}
				})
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			}
		}

		if (window.navigator.serviceWorker.controller) {
			// Already have a controller, try to update
			registerSW()
		} else {
			// No controller yet, register
			registerSW()
		}
	}, [])

	return {registration, isReady, error}
}

export function useBeforeInstallPrompt() {
	const [promptDeferred, setPromptDeferred] =
		useState<BeforeInstallPromptEvent | null>(null)
	const [isInstallable, setIsInstallable] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault()
			setPromptDeferred(e as BeforeInstallPromptEvent)
			setIsInstallable(true)
		}

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

		return () => {
			window.removeEventListener(
				'beforeinstallprompt',
				handleBeforeInstallPrompt,
			)
		}
	}, [])

	const promptInstall = async () => {
		if (!promptDeferred) return

		promptDeferred.prompt()
		const {outcome} = await promptDeferred.userChoice
		setIsInstallable(false)

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt')
		}

		setPromptDeferred(null)
	}

	return {isInstallable, promptInstall}
}

declare global {
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>
		userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>
	}
}
