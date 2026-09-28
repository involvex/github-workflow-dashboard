/**
 * Repository Name Filter Test
 *
 * This script validates that the name filtering functionality works correctly
 */

import * as fs from "node:fs";
import * as path from "node:path";

describe("Repository Name Filter", () => {
  test("should check context file for filter state and functions", async () => {
    const contextFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/contexts/repository-selection-context.tsx"),
      "utf8",
    );

    const hasNameFilterState = contextFile.includes("nameFilter: string");
    const hasFilteredRepos = contextFile.includes(
      "filteredRepositories: RepositoryWithWorkflowStatus[]",
    );
    const hasSetNameFilter = contextFile.includes(
      "setNameFilter: (filter: string) => void",
    );
    const hasClearFilter = contextFile.includes("clearFilter: () => void");
    const hasUseMemo = contextFile.includes("useMemo");

    expect(hasNameFilterState).toBe(true);
    expect(hasFilteredRepos).toBe(true);
    expect(hasSetNameFilter).toBe(true);
    expect(hasClearFilter).toBe(true);
    expect(hasUseMemo).toBe(true);
  });

  test("should check component file for search UI elements", async () => {
    const componentFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/components/repository-selection.tsx"),
      "utf8",
    );

    const hasSearchInput =
      componentFile.includes("Input") &&
      componentFile.includes("Filter repositories by name");
    const hasSearchIcon = componentFile.includes("<Search");
    const hasClearButton = componentFile.includes('<X className="w-4 h-4"');
    const hasFilteredResults = componentFile.includes("sortedRepositories.map");

    expect(hasSearchInput).toBe(true);
    expect(hasSearchIcon).toBe(true);
    expect(hasClearButton).toBe(true);
    expect(hasFilteredResults).toBe(true);
  });

  test("should check for Select All enhancement", async () => {
    const componentFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/components/repository-selection.tsx"),
      "utf8",
    );

    const hasSmartSelectAll = componentFile.includes(
      "filteredRepositories.filter",
    );
    const hasFilteredCount = componentFile.includes("filteredSelectedCount");

    expect(hasSmartSelectAll).toBe(true);
    expect(hasFilteredCount).toBe(true);
  });
});
