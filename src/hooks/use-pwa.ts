'use client'

import {useEffect, useState} from 'react'

declare global {
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>
		nodeResponse: Promise<{outcome: 'accepted' | 'dismissed'}>
	}
}

export function useServiceWorkerRegistration() {
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null)
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined' || !window.navigator?.serviceWorker) {
			return
		}

		const handleServiceWorkerRegistration = async () => {
			try {
				const registration = await window.navigator.serviceWorker.ready
				setRegistration(registration)
				setIsReady(true)
			} catch (error) {
				console.error('Service worker registration failed:', error)
			}
		}

		if (window.navigator.serviceWorker.controller) {
			handleServiceWorkerRegistration()
		} else {
			window.addEventListener(
				'serviceWorkerReady',
				handleServiceWorkerRegistration as EventListener,
			)
			window.addEventListener('load', handleServiceWorkerRegistration)
		}

		return () => {
			window.removeEventListener(
				'serviceWorkerReady',
				handleServiceWorkerRegistration as EventListener,
			)
			window.removeEventListener('load', handleServiceWorkerRegistration)
		}
	}, [])

	return {registration, isReady}
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
		const {outcome} = await promptDeferred.nodeResponse
		setIsInstallable(false)

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt')
		}

		setPromptDeferred(null)
	}

	return {isInstallable, promptInstall}
}
