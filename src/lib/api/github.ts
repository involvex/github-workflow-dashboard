import type { 
  GitHubRepository, 
  GitHubWorkflow, 
  GitHubWorkflowRun, 
  GitHubUser,
  GitHubApiResponse
} from './types';

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

export class GitHubApiClient {
  private baseUrl = 'https://api.github.com';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<GitHubApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `GitHub API Error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }
      
      throw new GitHubApiError(errorMessage, response.status, response);
    }

    // Extract rate limit information from headers (with null safety)
    const rateLimit = {
      limit: parseInt(response.headers?.get('X-RateLimit-Limit') || '0'),
      remaining: parseInt(response.headers?.get('X-RateLimit-Remaining') || '0'),
      reset: parseInt(response.headers?.get('X-RateLimit-Reset') || '0'),
    };

    const data = await response.json();
    const headers: Record<string, string> = {};
    if (response.headers) {
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }

    return {
      data,
      status: response.status,
      headers,
      rateLimit,
    };
  }

  // Validate token by making a test API call
  async validateToken(): Promise<GitHubUser> {
    const response = await this.makeRequest<GitHubUser>('/user');
    return response.data;
  }

  // Get organizations for the authenticated user
  async getUserOrganizations(): Promise<{ login: string; id: number; avatar_url: string; }[]> {
    const response = await this.makeRequest<{ login: string; id: number; avatar_url: string; }[]>('/user/orgs');
    return response.data;
  }

  // Get repositories for the authenticated user or organization
  async getRepositories(
    owner: string,
    isUser: boolean,
    options: {
      type?: 'all' | 'owner' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubRepository[]> {
    const searchParams = new URLSearchParams();
    
    if (options.type) searchParams.append('type', options.type);
    if (options.sort) searchParams.append('sort', options.sort);
    if (options.direction) searchParams.append('direction', options.direction);
    if (options.per_page) searchParams.append('per_page', options.per_page.toString());
    if (options.page) searchParams.append('page', options.page.toString());

    const endpoint = isUser
      ? `/users/${owner}/repos?${searchParams.toString()}`
      : `/orgs/${owner}/repos?${searchParams.toString()}`;

    const response = await this.makeRequest<GitHubRepository[]>(endpoint);
    return response.data;
  }

  // Get workflows for a specific repository
  async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const response = await this.makeRequest<{ workflows: GitHubWorkflow[] }>(
      `/repos/${owner}/${repo}/actions/workflows`
    );
    return response.data.workflows;
  }

  // Get workflow runs for a specific repository
  async getWorkflowRuns(
    owner: string, 
    repo: string,
    options: {
      actor?: string;
      branch?: string;
      event?: string;
      status?: 'completed' | 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'in_progress' | 'queued' | 'requested' | 'waiting';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubWorkflowRun[]> {
    const searchParams = new URLSearchParams();
    
    if (options.actor) searchParams.append('actor', options.actor);
    if (options.branch) searchParams.append('branch', options.branch);
    if (options.event) searchParams.append('event', options.event);
    if (options.status) searchParams.append('status', options.status);
    if (options.per_page) searchParams.append('per_page', options.per_page.toString());
    if (options.page) searchParams.append('page', options.page.toString());

    const response = await this.makeRequest<{ workflow_runs: GitHubWorkflowRun[] }>(
      `/repos/${owner}/${repo}/actions/runs?${searchParams.toString()}`
    );
    return response.data.workflow_runs;
  }

  // Get latest workflow run for each workflow in a repository (LEGACY - USE getLatestWorkflowRunsOptimized)
  async getLatestWorkflowRuns(owner: string, repo: string): Promise<GitHubWorkflowRun[]> {
    const workflows = await this.getWorkflows(owner, repo);
    const latestRuns: GitHubWorkflowRun[] = [];

    for (const workflow of workflows) {
      try {
        const runs = await this.getWorkflowRuns(owner, repo, {
          per_page: 1,
        });
        
        if (runs.length > 0) {
          latestRuns.push(runs[0]);
        }
      } catch (error) {
        // Continue if we can't get runs for a specific workflow
        console.warn(`Failed to get runs for workflow ${workflow.name}:`, error);
      }
    }

    return latestRuns;
  }

  // OPTIMIZED: Get latest workflow runs with single API call (up to 100 most recent runs)
  async getLatestWorkflowRunsOptimized(
    owner: string, 
    repo: string,
    options: {
      per_page?: number; // Number of latest runs to fetch (default: 20, max: 100)
      branch?: string;   // Filter by specific branch
    } = {}
  ): Promise<GitHubWorkflowRun[]> {
    const { per_page = 20, branch } = options;
    
    // Single API call to get the latest workflow runs across ALL workflows
    const runs = await this.getWorkflowRuns(owner, repo, {
      per_page: Math.min(per_page, 100), // GitHub API max is 100
      branch,
    });

    return runs;
  }

  // Get latest workflow run status for each unique workflow (most efficient for status checking)
  async getLatestWorkflowStatuses(
    owner: string, 
    repo: string,
    options: {
      per_page?: number; // Number of runs to check (default: 50, max: 100)
      branch?: string;   // Filter by specific branch
    } = {}
  ): Promise<{ [workflowId: number]: GitHubWorkflowRun }> {
    const { per_page = 50, branch } = options;
    
    // Get recent workflow runs
    const runs = await this.getWorkflowRuns(owner, repo, {
      per_page: Math.min(per_page, 100),
      branch,
    });

    // Group by workflow_id and keep only the latest run for each workflow
    const latestByWorkflow: { [workflowId: number]: GitHubWorkflowRun } = {};
    
    for (const run of runs) {
      if (!latestByWorkflow[run.workflow_id] || 
          new Date(run.created_at) > new Date(latestByWorkflow[run.workflow_id].created_at)) {
        latestByWorkflow[run.workflow_id] = run;
      }
    }

    return latestByWorkflow;
  }

  // ULTRA-OPTIMIZED: Check if repository has any recent workflow activity (single API call)
  async hasRecentWorkflowActivity(
    owner: string, 
    repo: string,
    options: {
      daysBack?: number; // Look for activity in the last N days (default: 30)
    } = {}
  ): Promise<{ hasActivity: boolean; latestRun?: GitHubWorkflowRun; totalRuns: number }> {
    const { daysBack = 30 } = options;
    
    try {
      // Single API call to check for any recent workflow runs
      const runs = await this.getWorkflowRuns(owner, repo, {
        per_page: 1, // We only need to know if ANY runs exist
      });

      if (runs.length === 0) {
        return { hasActivity: false, totalRuns: 0 };
      }

      const latestRun = runs[0];
      const runDate = new Date(latestRun.created_at);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const hasActivity = runDate >= cutoffDate;

      return {
        hasActivity,
        latestRun: hasActivity ? latestRun : undefined,
        totalRuns: runs.length
      };
    } catch {
      // If we can't access workflow runs, fall back to checking if workflows exist
      try {
        const workflows = await this.getWorkflows(owner, repo);
        return {
          hasActivity: workflows.length > 0,
          totalRuns: 0 // We don't know the run count, but we know workflows exist
        };
      } catch {
        return { hasActivity: false, totalRuns: 0 };
      }
    }
  }

  // Get rate limit status
  async getRateLimit(): Promise<{
    rate: {
      limit: number;
      remaining: number;
      reset: number;
    };
  }> {
    const response = await this.makeRequest<{
      rate: {
        limit: number;
        remaining: number;
        reset: number;
      };
    }>('/rate_limit');
    return response.data;
  }
}