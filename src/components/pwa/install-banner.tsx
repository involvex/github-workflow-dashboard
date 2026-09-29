'use client'

import {Button} from '@/components/ui/button'
import {useBeforeInstallPrompt} from '@/hooks/use-pwa'
import {Download} from 'lucide-react'
import {useState} from 'react'

export function InstallBanner() {
	const {isInstallable, promptInstall} = useBeforeInstallPrompt()
	const [showInfo, setShowInfo] = useState(false)

	if (!isInstallable) return null

	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0">
					<Download className="w-5 h-5 text-primary" />
				</div>
				<div className="flex-1">
					<h3 className="font-semibold text-foreground mb-1">
						Install Workflow Dashboard
					</h3>
					<p className="text-sm text-muted-foreground mb-3">
						Install for faster access, offline support, and push notifications.
					</p>
					<div className="flex gap-2">
						<Button
							size="sm"
							onClick={promptInstall}
						>
							Install Now
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowInfo(!showInfo)}
						>
							More Info
						</Button>
					</div>
					{showInfo && (
						<div className="mt-3 p-3 bg-muted/50 rounded-lg">
							<h4 className="text-xs font-medium text-foreground mb-2">
								Benefits:
							</h4>
							<ul className="text-xs text-muted-foreground space-y-1">
								<li className="flex items-center gap-2">
									<span className="text-primary">✓</span> Faster loading times
								</li>
								<li className="flex items-center gap-2">
									<span className="text-primary">✓</span> Offline access
								</li>
								<li className="flex items-center gap-2">
									<span className="text-primary">✓</span> Push notifications
								</li>
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
