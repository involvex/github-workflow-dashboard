/**
 * Workflow Context
 * Manages workflow status data and provides real-time updates
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { GitHubApiClient } from "@/lib/api/github";
import { GitHubWorkflowRun, Repository } from "@/lib/api/types";
import { useGitHubToken } from "./github-token-context";
import { useRepositorySelection } from "./repository-selection-context";
import { useDisplaySettings } from "./display-settings-context";

interface RepositoryWorkflows {
  repository: Repository;
  workflows: GitHubWorkflowRun[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface WorkflowContextType {
  repositoryWorkflows: RepositoryWorkflows[];
  isLoading: boolean;
  error: string | null;
  lastGlobalUpdate: Date | null;
  refreshWorkflows: () => Promise<void>;
  refreshRepository: (repositoryId: number) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined,
);

interface WorkflowProviderProps {
  children: ReactNode;
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const { token, isValidated } = useGitHubToken();
  const { selectedRepositories } = useRepositorySelection();
  const { settings } = useDisplaySettings();

  const [repositoryWorkflows, setRepositoryWorkflows] = useState<
    RepositoryWorkflows[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState<Date | null>(null);

  // Initialize repository workflows when selected repositories change
  useEffect(() => {
    setRepositoryWorkflows((current) => {
      const newRepositoryWorkflows = selectedRepositories.map((repository) => {
        // Keep existing data if repository was already tracked
        const existing = current.find(
          (rw) => rw.repository.id === repository.id,
        );
        if (existing) {
          return { ...existing, repository }; // Update repository data but keep workflows
        }

        // Create new entry for new repository
        return {
          repository,
          workflows: [],
          isLoading: false,
          error: null,
          lastUpdated: null,
        };
      });

      return newRepositoryWorkflows;
    });
  }, [selectedRepositories]);

  // Refresh workflows for a specific repository
  const refreshRepository = useCallback(
    async (repositoryId: number) => {
      if (!token || !isValidated) return;

      const repositoryWorkflow = repositoryWorkflows.find(
        (rw) => rw.repository.id === repositoryId,
      );
      if (!repositoryWorkflow) return;

      setRepositoryWorkflows((current) =>
        current.map((rw) =>
          rw.repository.id === repositoryId
            ? { ...rw, isLoading: true, error: null }
            : rw,
        ),
      );

      try {
        const apiClient = new GitHubApiClient(token);
        const [owner, repo] =
          repositoryWorkflow.repository.full_name.split("/");

        console.log(
          `[Workflow Context] 🚀 Fetching current workflow statuses for ${owner}/${repo}...`,
        );
        // Use getLatestWorkflowStatuses to get only the CURRENT status per workflow
        const workflowStatuses = await apiClient.getLatestWorkflowStatuses(
          owner,
          repo,
          {
            per_page: 50, // Look at recent runs to find latest for each workflow
          },
        );

        // Convert the workflow statuses object to an array for UI compatibility
        const workflows = Object.values(workflowStatuses);

        console.log(
          `[Workflow Context] ✅ Retrieved current status for ${workflows.length} active workflows in ${owner}/${repo}`,
        );

        setRepositoryWorkflows((current) =>
          current.map((rw) =>
            rw.repository.id === repositoryId
              ? {
                  ...rw,
                  workflows: workflows,
                  isLoading: false,
                  error: null,
                  lastUpdated: new Date(),
                }
              : rw,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch workflows";
        console.error(
          `[Workflow Context] ❌ Failed to fetch workflow statuses for repository ${repositoryId}:`,
          err,
        );

        setRepositoryWorkflows((current) =>
          current.map((rw) =>
            rw.repository.id === repositoryId
              ? { ...rw, workflows: [], isLoading: false, error: message }
              : rw,
          ),
        );
      }
    },
    [token, isValidated, repositoryWorkflows],
  );

  // Refresh all workflows
  const refreshWorkflows = useCallback(async () => {
    if (!token || !isValidated || repositoryWorkflows.length === 0) return;

    setIsLoading(true);
    setError(null);

    console.log(
      `[Workflow Context] 🔄 Refreshing workflows for ${repositoryWorkflows.length} repositories...`,
    );

    try {
      const apiClient = new GitHubApiClient(token);

      // Fetch workflows for all selected repositories in parallel
      const promises = repositoryWorkflows.map(async (rw) => {
        try {
          const [owner, repo] = rw.repository.full_name.split("/");
          console.log(
            `[Workflow Context] 🚀 Refreshing current workflow statuses for ${owner}/${repo}...`,
          );
          // Use getLatestWorkflowStatuses to get only the CURRENT status per workflow
          const workflowStatuses = await apiClient.getLatestWorkflowStatuses(
            owner,
            repo,
            {
              per_page: 50, // Look at recent runs to find latest for each workflow
            },
          );

          // Convert the workflow statuses object to an array for UI compatibility
          const workflows = Object.values(workflowStatuses);

          console.log(
            `[Workflow Context] ✅ Retrieved current status for ${workflows.length} active workflows in ${owner}/${repo}`,
          );

          return {
            repositoryId: rw.repository.id,
            workflows,
            error: null,
          };
        } catch (err) {
          return {
            repositoryId: rw.repository.id,
            workflows: [],
            error:
              err instanceof Error ? err.message : "Failed to fetch workflows",
          };
        }
      });

      const results = await Promise.all(promises);

      setRepositoryWorkflows((current) =>
        current.map((rw) => {
          const result = results.find(
            (r) => r.repositoryId === rw.repository.id,
          );
          if (!result) return rw;

          return {
            ...rw,
            workflows: result.workflows,
            error: result.error,
            isLoading: false,
            lastUpdated: new Date(),
          };
        }),
      );

      setLastGlobalUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh workflows",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, isValidated, repositoryWorkflows]);

  // Auto refresh workflows
  useEffect(() => {
    const refreshInterval = settings.refreshInterval * 1000; // Convert seconds to milliseconds
    if (refreshInterval <= 0 || repositoryWorkflows.length === 0) return;

    const interval = setInterval(() => {
      refreshWorkflows();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshWorkflows, settings.refreshInterval, repositoryWorkflows.length]);

  // Initial load when repositories become available
  useEffect(() => {
    if (token && isValidated && repositoryWorkflows.length > 0) {
      // Only fetch if we haven't loaded data for any repository yet
      const hasUnloadedRepos = repositoryWorkflows.some(
        (rw) => rw.workflows.length === 0 && !rw.isLoading && !rw.error,
      );

      if (hasUnloadedRepos) {
        refreshWorkflows();
      }
    }
  }, [token, isValidated, repositoryWorkflows, refreshWorkflows]);

  const value: WorkflowContextType = {
    repositoryWorkflows,
    isLoading,
    error,
    lastGlobalUpdate,
    refreshWorkflows,
    refreshRepository,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
