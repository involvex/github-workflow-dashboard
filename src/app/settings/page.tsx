'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGitHubToken } from '@/contexts/github-token-context';
import { useTheme } from '@/contexts/theme-context';
import { useDisplaySettings, REFRESH_INTERVALS } from '@/contexts/display-settings-context';
import { Badge } from '@/components/ui/badge';
import { RepositorySelection } from '@/components/repository-selection';
import { Moon, Sun, Monitor, Zap } from 'lucide-react';

export default function SettingsPage() {
  const {
    token,
    isValidated,
    isLoading,
    error,
    setToken,
    removeToken,
    isSecureStorageSupported
  } = useGitHubToken();
  
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings, toggleCompactMode, setRefreshInterval, getRefreshIntervalLabel, setDashboardName } = useDisplaySettings();
  
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardNameInput, setDashboardNameInput] = useState(settings.dashboardName);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenInput.trim()) return;
    
    setIsSubmitting(true);
    try {
      await setToken(tokenInput.trim());
      setTokenInput(''); // Clear input on success
    } catch (err) {
      // Error is handled by the context
      console.error('Failed to set token:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveToken = async () => {
    if (confirm('Are you sure you want to remove the GitHub token?')) {
      await removeToken();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your GitHub token and preferences</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* GitHub Token Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                GitHub Token
                <div className="flex items-center gap-2">
                  {!isSecureStorageSupported && (
                    <Badge variant="destructive" className="text-xs">
                      Secure storage not supported
                    </Badge>
                  )}
                  {token && isValidated && (
                    <Badge variant="default" className="text-xs">
                      Valid Token
                    </Badge>
                  )}
                  {token && !isValidated && !isLoading && (
                    <Badge variant="destructive" className="text-xs">
                      Invalid Token
                    </Badge>
                  )}
                  {isLoading && (
                    <Badge variant="secondary" className="text-xs">
                      Validating...
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Enter your GitHub Personal Access Token to monitor workflows.
                <br />
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Create a token on GitHub →
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {!isSecureStorageSupported && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mb-4">
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    ⚠️ Secure storage is not available in your browser. 
                    Tokens will only persist for this session.
                  </p>
                </div>
              )}

              {token ? (
                <div className="space-y-4">
                  <div>
                    <Label>Current Token</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        type="password" 
                        value={token.slice(0, 8) + '••••••••'} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button
                        variant="destructive"
                        onClick={handleRemoveToken}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Label>Update Token</Label>
                    <form onSubmit={handleTokenSubmit} className="mt-2">
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={tokenInput}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenInput(e.target.value)}
                          disabled={isSubmitting}
                          className="flex-1"
                        />
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !tokenInput.trim()}
                        >
                          {isSubmitting ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTokenSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="token">GitHub Personal Access Token</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={tokenInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenInput(e.target.value)}
                        disabled={isSubmitting}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Required scopes: <code className="bg-muted px-1 rounded">repo</code>, <code className="bg-muted px-1 rounded">actions:read</code>
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting || !tokenInput.trim()}
                    >
                      {isSubmitting ? 'Validating...' : 'Save Token'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Repository Selection - Only show when token is validated */}
          {token && isValidated && (
            <RepositorySelection />
          )}

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark
                    </>
                  )}
                </Button>
              </div>

              {/* Compact Mode Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more workflow statuses in less space
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={settings.compactMode}
                  onCheckedChange={toggleCompactMode}
                />
              </div>

              {/* Dashboard Name Setting */}
              <div className="space-y-2">
                <Label htmlFor="dashboard-name">Dashboard Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="dashboard-name"
                    value={dashboardNameInput}
                    onChange={(e) => setDashboardNameInput(e.target.value)}
                    placeholder="GitHub Flow Dashboard"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => setDashboardName(dashboardNameInput)}
                    disabled={dashboardNameInput === settings.dashboardName}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customize the title shown in the dashboard header
                </p>
              </div>

              {/* Refresh Interval Setting */}
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Auto Refresh Interval</Label>
                <Select
                  value={settings.refreshInterval.toString()}
                  onValueChange={(value) => {
                    const interval = parseInt(value, 10);
                    const validInterval = REFRESH_INTERVALS.find(i => i.value === interval);
                    if (validInterval) {
                      setRefreshInterval(validInterval.value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select refresh interval">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        {getRefreshIntervalLabel(settings.refreshInterval)}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REFRESH_INTERVALS.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value.toString()}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How often the dashboard should automatically update workflow statuses
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Token Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Token Requirements</CardTitle>
              <CardDescription>
                Your GitHub token needs the following permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm"><code className="bg-muted px-1 rounded">repo</code> - Access to repository data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm"><code className="bg-muted px-1 rounded">actions:read</code> - Read GitHub Actions workflows</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-primary-foreground/80 text-sm">
                  💡 <strong>Tip:</strong> Create a &ldquo;fine-grained&rdquo; personal access token 
                  for better security and limit access to specific repositories.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}