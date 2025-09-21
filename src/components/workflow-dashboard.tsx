'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
// Badge component not used after refactor; using inline spans for badges
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkflow } from '@/contexts/workflow-context';
import { useRepositorySelection } from '@/contexts/repository-selection-context';
import { useGitHubToken } from '@/contexts/github-token-context';
import { useDisplaySettings, REFRESH_INTERVALS } from '@/contexts/display-settings-context';
import { useTheme } from '@/contexts/theme-context';
import { GitHubWorkflowRun } from '@/lib/api/types';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Loader, ExternalLink, Moon, Sun, Monitor, Settings, ZoomIn, ZoomOut } from 'lucide-react';

interface WorkflowStatusBadgeProps {
  status: GitHubWorkflowRun['status'];
  conclusion: GitHubWorkflowRun['conclusion'];
}

function WorkflowStatusBadge({ status, conclusion }: WorkflowStatusBadgeProps) {
  if (!status) {
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">UNKNOWN</span>;
  }

  // Determine display info with subtle, transparent colors
  let displayText = status.toUpperCase();
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-600';
  let IconComponent = AlertCircle;

  if (status === 'in_progress') {
    displayText = 'RUNNING';
    bgColor = 'bg-sky-500';
    textColor = 'text-white';
    IconComponent = Loader;
  } else if (status === 'queued') {
    displayText = 'QUEUED';
    bgColor = 'bg-orange-500';
    textColor = 'text-white';
    IconComponent = Clock;
  } else if (status === 'waiting') {
    displayText = 'WAITING';
    bgColor = 'bg-amber-500';
    textColor = 'text-white';
    IconComponent = Clock;
  } else if (status === 'completed') {
    if (conclusion === 'success') {
      displayText = 'SUCCESS';
      bgColor = 'bg-emerald-500';
      textColor = 'text-white';
      IconComponent = CheckCircle;
    } else if (conclusion === 'failure') {
      displayText = 'FAILURE';
      bgColor = 'bg-rose-500';
      textColor = 'text-white';
      IconComponent = XCircle;
    } else if (conclusion === 'cancelled') {
      displayText = 'CANCELLED';
      bgColor = 'bg-stone-500';
      textColor = 'text-white';
      IconComponent = AlertCircle;
    } else if (conclusion === 'skipped') {
      displayText = 'SKIPPED';
      bgColor = 'bg-zinc-500';
      textColor = 'text-white';
      IconComponent = AlertCircle;
    } else if (conclusion === 'timed_out') {
      displayText = 'TIMEOUT';
      bgColor = 'bg-orange-600';
      textColor = 'text-white';
      IconComponent = Clock;
    } else {
      displayText = conclusion?.toUpperCase() || 'COMPLETED';
      bgColor = 'bg-slate-500';
      textColor = 'text-white';
      IconComponent = CheckCircle;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${bgColor} ${textColor} text-xs font-medium`}>
      <IconComponent className={`w-3 h-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
      <span>{displayText}</span>
    </span>
  );
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function WorkflowDashboard() {
  const { token, isValidated, userId } = useGitHubToken();
  const { selectedRepositories } = useRepositorySelection();
  const { settings, toggleCompactMode, setRefreshInterval } = useDisplaySettings();
  const { theme, setTheme } = useTheme();
  const { 
    repositoryWorkflows, 
    isLoading, 
    error, 
    lastGlobalUpdate, 
    refreshWorkflows, 
    refreshRepository,
  } = useWorkflow();

  // Filter state management
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [onlyMe, setOnlyMe] = React.useState(false);

  // Get total repository count (before filtering)
  const totalRepoCount = repositoryWorkflows.length;

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // R key to refresh (when not focused on inputs)
      if (event.key === 'r' && !['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        refreshWorkflows();
      }
      
      // S key to go to settings
      if (event.key === 's' && !['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        window.location.href = '/settings';
      }
      
      // Z key to toggle compact mode
      if (event.key === 'z' && !['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        toggleCompactMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshWorkflows, toggleCompactMode]);

  // Show setup message if no token
  if (!token || !isValidated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              Please configure your GitHub token in settings to view workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show repository selection message if no repositories selected
  if (selectedRepositories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              No Repositories Selected
            </CardTitle>
            <CardDescription>
              Please select repositories to monitor in settings
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => window.location.href = '/settings'} className="w-full">
              Select Repositories
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Select repositories from your accessible organizations to monitor their GitHub Actions workflows
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to check if workflow matches onlyMe filter
  const matchesOnlyMeFilter = (workflow: GitHubWorkflowRun) => {
    if (!onlyMe || !userId) return true;
    const actor = workflow.actor?.login || '';
    const commitAuthor = (workflow.head_commit && (workflow.head_commit.author?.name || workflow.head_commit.author?.email)) || '';
    return actor === userId || commitAuthor === userId;
  };

  const totalWorkflows = repositoryWorkflows.reduce((sum, rw) => {
    const filteredWorkflows = rw.workflows.filter(matchesOnlyMeFilter);
    return sum + filteredWorkflows.length;
  }, 0);
  
  // Count workflows by exact status and conclusion (respecting onlyMe filter)
  const statusCounts: Record<string, number> = {};
  const conclusionCounts: Record<string, number> = {};
  
  repositoryWorkflows.forEach(rw => {
    rw.workflows.forEach(workflow => {
      // Only count if it matches the onlyMe filter
      if (!matchesOnlyMeFilter(workflow)) return;
      
      // Count by status
      statusCounts[workflow.status] = (statusCounts[workflow.status] || 0) + 1;
      
      // Count by conclusion if workflow is completed
      if (workflow.status === 'completed' && workflow.conclusion) {
        conclusionCounts[workflow.conclusion] = (conclusionCounts[workflow.conclusion] || 0) + 1;
      }
    });
  });

  // Create summary cards data - only include non-zero counts
  const summaryCards = [];
  
  // Always show total first
  summaryCards.push({
    label: 'Total',
    count: totalWorkflows,
    bgColor: 'bg-slate-700',
    iconColor: 'text-white',
    iconBg: 'bg-white/30',
    icon: null // Just a dot
  });


  // Add status counts (only if > 0) with elegant, cohesive colors
  Object.entries(statusCounts).forEach(([status, count]) => {
    if (count > 0 && status !== 'completed') { // Skip completed as it's broken down by conclusion
      let bgColor, iconColor, iconBg, icon;
      
      if (status === 'in_progress') {
        bgColor = 'bg-sky-600';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'Loader';
      } else if (status === 'queued') {
        bgColor = 'bg-orange-500';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'Clock';
      } else if (status === 'waiting') {
        bgColor = 'bg-amber-500';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'Clock';
      } else {
        bgColor = 'bg-stone-600';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'AlertCircle';
      }
      
      summaryCards.push({
        label: status,
        count: count,
        bgColor: bgColor,
        iconColor: iconColor,
        iconBg: iconBg,
        icon: icon
      });
    }
  });

  // Add conclusion counts (only if > 0) with elegant, cohesive colors
  Object.entries(conclusionCounts).forEach(([conclusion, count]) => {
    if (count > 0) {
      let bgColor, iconColor, iconBg, icon;
      
      if (conclusion === 'success') {
        bgColor = 'bg-emerald-600';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'CheckCircle';
      } else if (conclusion === 'failure') {
        bgColor = 'bg-rose-600';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'XCircle';
      } else if (conclusion === 'cancelled') {
        bgColor = 'bg-stone-500';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'AlertCircle';
      } else if (conclusion === 'skipped') {
        bgColor = 'bg-zinc-500';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'AlertCircle';
      } else if (conclusion === 'timed_out') {
        bgColor = 'bg-orange-600';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'Clock';
      } else {
        bgColor = 'bg-slate-500';
        iconColor = 'text-white';
        iconBg = 'bg-white/30';
        icon = 'CheckCircle';
      }
      
      summaryCards.push({
        label: conclusion,
        count: count,
        bgColor: bgColor,
        iconColor: iconColor,
        iconBg: iconBg,
        icon: icon
      });
    }
  });

  // Function to get active card styles based on card type
  const getActiveCardStyles = (label: string) => {
    const baseStyles = 'ring-inset';
    
    switch (label.toLowerCase()) {
      case 'total':
        return `${baseStyles} ring-4 ring-slate-800 dark:ring-slate-300`;
      case 'queued':
        return `${baseStyles} ring-4 ring-orange-800 dark:ring-orange-300`;
      case 'failure':
        return `${baseStyles} ring-4 ring-rose-800 dark:ring-rose-300`;
      case 'success':
        return `${baseStyles} ring-4 ring-emerald-800 dark:ring-emerald-300`;
      case 'cancelled':
        return `${baseStyles} ring-4 ring-stone-800 dark:ring-stone-300`;
      case 'in_progress':
      case 'running':
        return `${baseStyles} ring-4 ring-sky-800 dark:ring-sky-300`;
      default:
        return `${baseStyles} ring-4 ring-gray-800 dark:ring-gray-300`;
    }
  };

  // Function to render icon based on type
  const renderIcon = (iconType: string | null, iconColor: string, compactSize?: boolean) => {
    if (!iconType) {
      const dotSize = compactSize ? 'w-3 h-3' : 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8';
      return <div className={`${dotSize} ${iconColor} bg-current rounded-full opacity-80`}></div>;
    }

    const iconSize = compactSize ? 'w-4 h-4' : 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8';
    const iconProps = { className: `${iconSize} ${iconColor} drop-shadow-sm ${iconType === 'Loader' ? 'animate-spin' : ''}` };

    switch (iconType) {
      case 'Clock': return <Clock {...iconProps} />;
      case 'Loader': return <Loader {...iconProps} />;
      case 'CheckCircle': return <CheckCircle {...iconProps} />;
      case 'XCircle': return <XCircle {...iconProps} />;
      case 'AlertCircle': return <AlertCircle {...iconProps} />;
      case 'Monitor': return <Monitor {...iconProps} />;
      default: return <div className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${iconColor} bg-current rounded-full opacity-80`}></div>;
    }
  };

  // Function to filter workflows based on active filter and onlyMe
  const filterWorkflows = (workflows: GitHubWorkflowRun[]) => {
    let filteredWorkflows = workflows;
    
    // First apply the "Only Me" filter if enabled
    if (onlyMe && userId) {
      filteredWorkflows = filteredWorkflows.filter(workflow => {
        const actor = workflow.actor?.login || '';
        const commitAuthor = (workflow.head_commit && (workflow.head_commit.author?.name || workflow.head_commit.author?.email)) || '';
        return actor === userId || commitAuthor === userId;
      });
    }
    
    // Then apply the status/conclusion filter if active
    if (!activeFilter || activeFilter === 'Total') {
      return filteredWorkflows; // Show all workflows (after onlyMe filter)
    }
    
    return filteredWorkflows.filter(workflow => {
      // Filter by status (for non-completed workflows)
      if (workflow.status === activeFilter) {
        return true;
      }
      
      // Filter by conclusion (for completed workflows)
      if (workflow.status === 'completed' && workflow.conclusion === activeFilter) {
        return true;
      }
      
      return false;
    });
  };

  return (
    <div>
      {/* Unified header with title and controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{settings.dashboardName}</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Monitoring {repositoryWorkflows.length} {activeFilter ? `of ${totalRepoCount}` : ''} repositories
            {activeFilter && (
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                Filtered by: {activeFilter}
              </span>
            )}
            {lastGlobalUpdate && (
              <span className="ml-2 text-xs sm:text-sm">
                • Last updated {formatTimeAgo(lastGlobalUpdate.toISOString())}
              </span>
            )}
            <br />
            <span className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">R</kbd> to refresh, <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">S</kbd> for settings, <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">Z</kbd> for compact mode
              {activeFilter && (
                <span className="ml-2">
                  • <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">Click card again</kbd> to clear filter
                </span>
              )}
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Only Me filter checkbox */}
          {userId && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="only-me"
                checked={onlyMe}
                onCheckedChange={(checked) => setOnlyMe(checked === true)}
                className="h-4 w-4 border-2 border-slate-400 dark:border-slate-500 bg-background"
              />
              <label
                htmlFor="only-me"
                className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer"
              >
                Only Me
              </label>
            </div>
          )}
          
          {/* Auto-refresh dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Auto-refresh:</span>
            <Select
              value={settings.refreshInterval.toString()}
              onValueChange={(value) => {
                const interval = REFRESH_INTERVALS.find(i => i.value.toString() === value);
                if (interval) setRefreshInterval(interval.value);
              }}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value.toString()}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Icon-based controls */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <Button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* Compact mode toggle */}
            <Button
              onClick={toggleCompactMode}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={`${settings.compactMode ? 'Exit compact mode (zoom out)' : 'Enter compact mode (zoom in)'}`}
            >
              {settings.compactMode ? (
                <ZoomOut className="h-4 w-4" />
              ) : (
                <ZoomIn className="h-4 w-4" />
              )}
            </Button>
            
            {/* Manual refresh */}
            <Button 
              onClick={refreshWorkflows}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Refresh all workflows"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Settings */}
            <Button 
              onClick={() => window.location.href = '/settings'}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className={`grid gap-2 ${
        settings.compactMode 
          ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10' 
          : summaryCards.length <= 3 
          ? 'grid-cols-1 sm:grid-cols-3' 
          : summaryCards.length <= 4 
          ? 'grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      }`}>
        {summaryCards.map((card) => {
          const isActive = activeFilter === card.label;
          return (
            <Card 
              key={card.label} 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                settings.compactMode ? 'rounded-lg' : ''
              } ${
                isActive 
                  ? getActiveCardStyles(card.label)
                  : 'hover:shadow-lg border-transparent'
              } ${card.bgColor} backdrop-blur-sm`}
              onClick={() => {
                // Toggle filter: if clicking active filter, clear it; otherwise set it
                setActiveFilter(activeFilter === card.label ? null : card.label);
              }}
            >
              <CardContent className={settings.compactMode ? "p-1" : "p-4 sm:p-5"}>
                {settings.compactMode ? (
                  // Compact: Horizontal layout with number + icon only
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-lg font-black text-white drop-shadow-lg">
                      {card.count}
                    </p>
                    <div className="bg-white/20 backdrop-blur-sm w-6 h-6 rounded-md flex items-center justify-center shadow-lg border border-white/30">
                      {renderIcon(card.icon, 'text-white', true)}
                    </div>
                  </div>
                ) : (
                  // Normal: Vertical layout with labels
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-bold text-white/90 capitalize mb-1 tracking-wide">
                        {card.label}
                      </p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg">
                        {card.count}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                        {renderIcon(card.icon, 'text-white', false)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Global error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository workflow cards */}
      {settings.compactMode ? (
        // Compact mode: Show flat workflow cards without repository wrappers
        <div className="mt-6">
          <div 
            className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 auto-rows-max overflow-y-auto" 
            style={{maxHeight: 'calc(100vh - 320px)'}}
          >
            {repositoryWorkflows
              .filter(repositoryWorkflow => {
                if (repositoryWorkflow.isLoading || repositoryWorkflow.error) {
                  return false; // Don't show loading/error states in compact mode
                }
                return filterWorkflows(repositoryWorkflow.workflows).length > 0;
              })
              .flatMap(repositoryWorkflow => 
                filterWorkflows(repositoryWorkflow.workflows).map(workflow => ({
                  ...workflow,
                  repositoryName: `${repositoryWorkflow.repository.owner.login}/${repositoryWorkflow.repository.name}`,
                  repositoryOwner: repositoryWorkflow.repository.owner.login,
                  repositoryUrl: repositoryWorkflow.repository.html_url
                }))
              )
              .map((workflow) => {
                // Determine strong colored border based on status
                let borderColor = 'border-l-4 border-l-slate-300 dark:border-l-slate-600';
                if (workflow.status === 'completed') {
                  if (workflow.conclusion === 'success') {
                    borderColor = 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400';
                  } else if (workflow.conclusion === 'failure') {
                    borderColor = 'border-l-4 border-l-rose-500 dark:border-l-rose-400';
                  } else if (workflow.conclusion === 'cancelled') {
                    borderColor = 'border-l-4 border-l-stone-500 dark:border-l-stone-400';
                  } else if (workflow.conclusion === 'skipped') {
                    borderColor = 'border-l-4 border-l-zinc-500 dark:border-l-zinc-400';
                  }
                } else if (workflow.status === 'in_progress') {
                  borderColor = 'border-l-4 border-l-sky-500 dark:border-l-sky-400';
                } else if (workflow.status === 'queued') {
                  borderColor = 'border-l-4 border-l-orange-500 dark:border-l-orange-400';
                }
                
                return (
                  <div
                    key={`${workflow.repositoryName}-${workflow.id}`}
                    className={`flex flex-col p-2 border rounded-lg hover:shadow-md hover:border-primary/30 transition-all duration-200 gap-2 ${borderColor} h-fit`}
                  >
                    {/* Repository name link */}
                    <div className="flex items-center gap-1 mb-1">
                      <a
                        href={workflow.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group truncate"
                      >
                        <span className="truncate">{workflow.repositoryName}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                      </a>
                    </div>
                    
                    {/* Workflow title */}
                    <div className="flex items-start">
                      <a
                        href={workflow.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-foreground hover:text-primary transition-colors flex-1 min-w-0 group"
                      >
                        <span className="line-clamp-2">{workflow.name}</span>
                      </a>
                    </div>
                    
                    {/* Workflow metadata */}
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      <span>#{workflow.run_number}</span>
                      <span>•</span>
                      <span className="truncate">{workflow.head_branch}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(workflow.updated_at)}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      ) : (
        // Normal mode: Show repository-grouped workflow cards
        <div className="grid gap-4 mt-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {repositoryWorkflows
          .filter(repositoryWorkflow => {
            // Only show repositories that have workflows matching the current filter
            // or if there's an error/loading state we should still show them
            if (repositoryWorkflow.isLoading || repositoryWorkflow.error) {
              return true;
            }
            return filterWorkflows(repositoryWorkflow.workflows).length > 0;
          })
          .map((repositoryWorkflow) => (
          <Card key={repositoryWorkflow.repository.id} className={`overflow-hidden ${settings.compactMode ? 'compact-card' : ''}`}>
            <CardHeader className={settings.compactMode ? 'pb-2' : ''}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className={`${settings.compactMode ? 'text-sm' : 'text-base sm:text-lg'}`}>
                    <a
                      href={repositoryWorkflow.repository.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-2 transition-colors text-foreground"
                    >
                      <span className="truncate">
                        <span className="text-muted-foreground text-xs font-normal">{repositoryWorkflow.repository.owner.login}/</span>
                        {repositoryWorkflow.repository.name}
                      </span>
                      <ExternalLink className={`${settings.compactMode ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'} flex-shrink-0`} />
                    </a>
                  </CardTitle>
                  {!settings.compactMode && (
                    <CardDescription className="text-xs sm:text-sm line-clamp-2">
                      {repositoryWorkflow.repository.description || 'No description'}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Removed 'Updated ...' label to prevent header squishing and button overflow */}
                  <Button
                    onClick={() => refreshRepository(repositoryWorkflow.repository.id)}
                    disabled={repositoryWorkflow.isLoading}
                    variant="outline"
                    size={settings.compactMode ? "sm" : "sm"}
                    className={`${settings.compactMode ? 'h-6 w-6' : 'h-8 w-8'} p-0`}
                    title="Refresh repository"
                  >
                    <RefreshCw className={`${settings.compactMode ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${repositoryWorkflow.isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className={settings.compactMode ? 'pt-0' : ''}>
              {repositoryWorkflow.isLoading ? (
                <div className={`flex items-center justify-center ${settings.compactMode ? 'py-4' : 'py-8'}`}>
                  <Loader className={`${settings.compactMode ? 'w-4 h-4' : 'w-6 h-6'} animate-spin text-muted-foreground`} />
                  <span className={`ml-2 text-muted-foreground ${settings.compactMode ? 'text-sm' : ''}`}>Loading workflows...</span>
                </div>
              ) : repositoryWorkflow.error ? (
                <div className={`flex items-center gap-2 ${settings.compactMode ? 'py-2' : 'py-4'} text-destructive`}>
                  <XCircle className={`${settings.compactMode ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <span className={settings.compactMode ? 'text-sm' : ''}>{repositoryWorkflow.error}</span>
                </div>
              ) : filterWorkflows(repositoryWorkflow.workflows).length === 0 ? (
                <div className={`text-center ${settings.compactMode ? 'py-4' : 'py-8'} text-muted-foreground`}>
                  <p className={settings.compactMode ? 'text-sm' : ''}>
                    {activeFilter 
                      ? `No workflows found with status "${activeFilter}"` 
                      : 'No recent workflows found'
                    }
                  </p>
                  {!settings.compactMode && !activeFilter && (
                    <p className="text-sm">This repository may not have GitHub Actions configured</p>
                  )}
                </div>
              ) : (
                <div className={`space-y-${settings.compactMode ? '3' : '4'}`}>
                  {filterWorkflows(repositoryWorkflow.workflows).map((workflow) => {
                    // Determine strong colored border based on status
                    let borderColor = 'border-l-4 border-l-slate-300 dark:border-l-slate-600';
                    if (workflow.status === 'completed') {
                      if (workflow.conclusion === 'success') {
                        borderColor = 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400';
                      } else if (workflow.conclusion === 'failure') {
                        borderColor = 'border-l-4 border-l-rose-500 dark:border-l-rose-400';
                      } else if (workflow.conclusion === 'cancelled') {
                        borderColor = 'border-l-4 border-l-stone-500 dark:border-l-stone-400';
                      } else if (workflow.conclusion === 'skipped') {
                        borderColor = 'border-l-4 border-l-zinc-500 dark:border-l-zinc-400';
                      }
                    } else if (workflow.status === 'in_progress') {
                      borderColor = 'border-l-4 border-l-sky-500 dark:border-l-sky-400';
                    } else if (workflow.status === 'queued') {
                      borderColor = 'border-l-4 border-l-orange-500 dark:border-l-orange-400';
                    }
                    
                    return (
                    <div
                      key={workflow.id}
                      className={`flex flex-col ${settings.compactMode ? 'p-3' : 'p-4'} border rounded-xl hover:shadow-md hover:border-primary/30 transition-all duration-200 gap-${settings.compactMode ? '2' : '3'} ${borderColor}`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <a
                              href={workflow.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`font-bold hover:text-primary transition-colors ${settings.compactMode ? 'text-base' : 'text-lg'} text-foreground flex items-center gap-2 group`}
                            >
                              <span className="flex-1 min-w-0">{workflow.name}</span>
                              <ExternalLink className={`${settings.compactMode ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
                            </a>
                          </div>
                          <div className="flex-shrink-0">
                            <WorkflowStatusBadge 
                              status={workflow.status} 
                              conclusion={workflow.conclusion} 
                            />
                          </div>
                        </div>
                        <div className={`flex flex-wrap items-center gap-2 ${settings.compactMode ? 'mt-1' : 'mt-2 sm:gap-4'} text-xs ${settings.compactMode ? '' : 'sm:text-sm'} text-muted-foreground`}>
                          <span>#{workflow.run_number}</span>
                          <span>on {workflow.head_branch}</span>
                          {!settings.compactMode && <span>by {workflow.actor.login}</span>}
                          <span>{formatTimeAgo(workflow.updated_at)}</span>
                        </div>
                        {!settings.compactMode && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-2">
                            {workflow.display_title}
                          </p>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No repositories message when filtered */}
      {activeFilter && repositoryWorkflows.filter(rw => 
        (rw.isLoading || rw.error) || filterWorkflows(rw.workflows).length > 0
      ).length === 0 && (
        <Card className="mt-6">
          <CardContent className="pt-8 pb-8">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No repositories have workflows with status &quot;{activeFilter}&quot;</p>
              <p className="text-sm mt-2">Try selecting a different filter or click the active filter to show all workflows.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}