'use client'

import {Button} from '@/components/ui/button'
import {useNetworkStatus} from '@/hooks/use-network-status'
import {RefreshCw, WifiOff} from 'lucide-react'

interface OfflineIndicatorProps {
	onRetry?: () => void
}

export function OfflineIndicator({onRetry}: OfflineIndicatorProps) {
	const {isOnline} = useNetworkStatus()

	if (isOnline) return null

	return (
		<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full">
			<div className="bg-muted/90 backdrop-blur-sm border border-destructive/20 rounded-lg p-4 shadow-lg flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex-shrink-0">
						<WifiOff className="w-6 h-6 text-destructive" />
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-foreground">Offline Mode</h3>
						<p className="text-sm text-muted-foreground">
							Showing cached data. Connect to the internet to refresh.
						</p>
					</div>
				</div>
				{onRetry && (
					<Button
						variant="outline"
						size="sm"
						onClick={onRetry}
					>
						<RefreshCw className="w-4 h-4 mr-2" />
						Refresh
					</Button>
				)}
			</div>
		</div>
	)
}
