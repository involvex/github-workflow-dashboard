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
  const { settings, toggleCompactMode, setRefreshInterval, getRefreshIntervalLabel, setDashboardName } = useDisplaySettings();
  
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
                    placeholder="GitHub Workflow Dashboard"
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

          {/* Token Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Token Instructions</CardTitle>
              <CardDescription>
                How to create and configure your GitHub Personal Access Token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Required Permissions Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Required Permissions:</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      <code>repo</code> - Repository access
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      <code>actions:read</code> - Workflow access
                    </span>
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                      <code>read:org</code> - Organization access (optional)
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">💡 How to Create Your Token</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Option 1: Fine-grained Token (Recommended)</h5>
                      <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>1. Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline font-medium">GitHub Settings → Personal access tokens</a></li>
                        <li>2. Click &quot;Generate new token&quot; → &quot;Fine-grained personal access token&quot;</li>
                        <li>3. Select your repositories or choose &quot;All repositories&quot;</li>
                        <li>4. Under &quot;Repository permissions&quot;, set:</li>
                        <li className="ml-4">• <strong>Actions:</strong> Read</li>
                        <li className="ml-4">• <strong>Contents:</strong> Read</li>
                        <li className="ml-4">• <strong>Metadata:</strong> Read (auto-selected)</li>
                        <li>5. Set an expiration date (90 days recommended)</li>
                        <li>6. Generate and copy your token immediately</li>
                      </ol>
                    </div>
                    
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                      <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Option 2: Classic Token (Also Works)</h5>
                      <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>1. Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline font-medium">GitHub Settings → Personal access tokens</a></li>
                        <li>2. Click &quot;Generate new token&quot; → &quot;Generate new token (classic)&quot;</li>
                        <li>3. Set an expiration date and note</li>
                        <li>4. Select these scopes:</li>
                        <li className="ml-4">• <strong>repo</strong> (Full control of private repositories)</li>
                        <li className="ml-4">• <strong>workflow</strong> (Update GitHub Action workflows) - <em>includes actions:read</em></li>
                        <li className="ml-4">• <strong>read:org</strong> (Read organization membership) - <em>for organization access</em></li>
                        <li>5. Generate and copy your token immediately</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">🔒 Security Best Practices</h4>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <li>• Use <strong>fine-grained tokens</strong> instead of classic tokens for better security</li>
                    <li>• Limit access to only the repositories you need to monitor</li>
                    <li>• Set reasonable expiration dates and rotate tokens regularly</li>
                    <li>• Never share your token or commit it to version control</li>
                    <li>• Store tokens securely using your browser&apos;s credential manager when available</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">⚠️ Organization & Cross-Repo Access</h4>
                  <div className="text-xs text-orange-800 dark:text-orange-200 space-y-2">
                    <p><strong>For scanning ALL organizations and repositories, you may need additional permissions:</strong></p>
                    <ul className="space-y-1 mt-2">
                      <li>• <strong>Organization approval:</strong> Fine-grained tokens require org admin approval</li>
                      <li>• <strong>Classic tokens:</strong> May need <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">read:org</code> scope for organization access</li>
                      <li>• <strong>Multiple orgs:</strong> Separate tokens may be needed for each organization</li>
                      <li>• <strong>Private repos:</strong> Token must have explicit access to each private repository</li>
                    </ul>
                    <p className="mt-2 italic">Note: Some organizations may restrict or require approval for external tokens.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}