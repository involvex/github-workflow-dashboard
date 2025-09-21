import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GitHubTokenProvider } from "@/contexts/github-token-context";
import { RepositorySelectionProvider } from "@/contexts/repository-selection-context";
import { WorkflowProvider } from "@/contexts/workflow-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { DisplaySettingsProvider } from "@/contexts/display-settings-context";

// Removed Geist font imports for Docker build reliability

export const metadata: Metadata = {
  title: "GitHub Flow Dashboard",
  description: "Monitor GitHub Actions workflows across your repositories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <ThemeProvider>
          <DisplaySettingsProvider>
            <GitHubTokenProvider>
              <RepositorySelectionProvider>
                <WorkflowProvider>
                  {children}
                </WorkflowProvider>
              </RepositorySelectionProvider>
            </GitHubTokenProvider>
          </DisplaySettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
