import {DisplaySettingsProvider} from '@/contexts/display-settings-context'
import {GitHubTokenProvider} from '@/contexts/github-token-context'
import {NotificationProvider} from '@/contexts/notification-context'
import {RepositorySelectionProvider} from '@/contexts/repository-selection-context'
import {ThemeProvider} from '@/contexts/theme-context'
import {WorkflowProvider} from '@/contexts/workflow-context'
import type {Metadata} from 'next'

export const metadata: Metadata = {
	title: 'GitHub Workflow Dashboard',
	description: 'Monitor GitHub Actions workflows across your repositories',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
		>
			<head>
				<link
					rel="manifest"
					href="/manifest.json"
				/>
				<link
					rel="apple-touch-icon"
					href="/icons/icon-192.svg"
				/>
			</head>
			<body
				className="antialiased"
				style={{fontFamily: 'system-ui, sans-serif'}}
			>
				<ThemeProvider>
					<NotificationProvider>
						<DisplaySettingsProvider>
							<GitHubTokenProvider>
								<RepositorySelectionProvider>
									<WorkflowProvider>{children}</WorkflowProvider>
								</RepositorySelectionProvider>
							</GitHubTokenProvider>
						</DisplaySettingsProvider>
					</NotificationProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
