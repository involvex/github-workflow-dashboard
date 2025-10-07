"use client";

import { useState } from "react";
import { useGitHubToken } from "@/contexts/github-token-context";
import { useRepositorySelection } from "@/contexts/repository-selection-context";
import { GitHubApiClient } from "@/lib/api/github";
import { WORKFLOW_PRESETS, WorkflowPreset } from "@/lib/workflow-presets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, GitMerge } from "lucide-react";

export function WorkflowPresets() {
  const { token } = useGitHubToken();
  const { selectedRepositories } = useRepositorySelection();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<
    Record<string, { message: string; status: "success" | "error" }>
  >({});

  const handleAddPreset = async (preset: WorkflowPreset) => {
    if (!token || selectedRepositories.length === 0) return;

    setIsLoading(true);
    setResults({});
    const apiClient = new GitHubApiClient(token);

    const outcomes = await Promise.all(
      selectedRepositories.map(async (repo) => {
        try {
          await apiClient.createOrUpdateFile(
            repo.owner.login,
            repo.name,
            `.github/workflows/${preset.filename}`,
            preset.content,
            `feat: add ${preset.name} workflow`,
          );
          return {
            repoId: repo.id,
            message: "Workflow added successfully!",
            status: "success" as const,
          };
        } catch (error: unknown) {
          let message = "Failed to add workflow.";
          if (error instanceof Error) {
            if (error.message && error.message.includes("sha")) {
              message = "Workflow file already exists.";
            } else if (error.message) {
              message = error.message;
            }
          }
          return { repoId: repo.id, message, status: "error" as const };
        }
      }),
    );

    const newResults: Record<
      string,
      { message: string; status: "success" | "error" }
    > = {};
    outcomes.forEach((o) => {
      newResults[o.repoId] = { message: o.message, status: o.status };
    });

    setResults(newResults);
    setIsLoading(false);
  };

  if (selectedRepositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5" />
            Workflow Presets
          </CardTitle>
          <CardDescription>
            Add pre-configured GitHub Actions workflows to your selected
            repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please select one or more repositories in the Repository Selection
            section above to add workflows.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="w-5 h-5" />
          Workflow Presets
        </CardTitle>
        <CardDescription>
          Add pre-configured GitHub Actions workflows to your{" "}
          {selectedRepositories.length} selected repositories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {WORKFLOW_PRESETS.map((preset) => (
          <div key={preset.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{preset.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {preset.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Filename:{" "}
                  <code className="bg-muted px-1 rounded">
                    {preset.filename}
                  </code>
                </p>
              </div>
              <Button
                onClick={() => handleAddPreset(preset)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add to Repositories"
                )}
              </Button>
            </div>
          </div>
        ))}
        {Object.keys(results).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Results</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {selectedRepositories.map((repo) => {
                const result = results[repo.id];
                if (!result) return null;
                return (
                  <div
                    key={repo.id}
                    className="text-sm flex items-center gap-2"
                  >
                    {result.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium">{repo.full_name}:</span>
                    <span>{result.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
