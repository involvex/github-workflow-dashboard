'use client'

import {useCallback, useEffect, useState} from 'react'

export function useNetworkStatus() {
	const [isOnline, setIsOnline] = useState<boolean>(() => {
		if (typeof navigator !== 'undefined') {
			return navigator.onLine
		}
		return true
	})

	const [connectionType, setConnectionType] = useState<string>('unknown')

	useEffect(() => {
		const handleOnline = () => setIsOnline(true)
		const handleOffline = () => setIsOnline(false)

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	useEffect(() => {
		if (typeof navigator !== 'undefined' && 'connection' in navigator) {
			const connection = (
				navigator as unknown as {connection?: {effectiveType?: string}}
			).connection
			if (connection?.effectiveType) {
				setConnectionType(connection.effectiveType)
			}
		}
	}, [])

	const waitForOnline = useCallback(async (): Promise<void> => {
		if (isOnline) return

		return new Promise(resolve => {
			const handleOnline = () => {
				window.removeEventListener('online', handleOnline)
				resolve()
			}
			window.addEventListener('online', handleOnline)
		})
	}, [isOnline])

	return {isOnline, connectionType, waitForOnline}
}
