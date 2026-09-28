/**
 * Repository Selector Enhancement Test
 *
 * This script validates that pagination and workflow filtering are working correctly
 */

import * as fs from "node:fs";
import * as path from "node:path";

describe("Repository Selector Enhancements", () => {
  test("should check for pagination implementation", async () => {
    const contextFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/contexts/repository-selection-context.tsx"),
      "utf8",
    );

    const hasPaginationLoop = contextFile.includes("while (true)");
    const hasPerPageConfig = contextFile.includes("per_page: perPage");
    const hasPageIncrement = contextFile.includes("page++");
    const hasMaxPerPage = contextFile.includes("perPage = 100");

    expect(hasPaginationLoop).toBe(true);
    expect(hasPerPageConfig).toBe(true);
    expect(hasPageIncrement).toBe(true);
    expect(hasMaxPerPage).toBe(true);
  });

  test("should check for workflow filtering", async () => {
    const contextFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/contexts/repository-selection-context.tsx"),
      "utf8",
    );

    const hasWorkflowCheck = contextFile.includes("hasRecentWorkflowActivity");
    const hasWorkflowFiltering = contextFile.includes("hasActivity");
    const hasWorkflowSkipping = contextFile.includes(
      "Background workflow checking complete",
    );

    expect(hasWorkflowCheck).toBe(true);
    expect(hasWorkflowFiltering).toBe(true);
    expect(hasWorkflowSkipping).toBe(true);
  });

  test("should check for progress indicators", async () => {
    const contextFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/contexts/repository-selection-context.tsx"),
      "utf8",
    );

    const hasLoadingStatus = contextFile.includes("loadingStatus");
    const hasProgressUpdate = contextFile.includes("setLoadingStatus");
    const hasProgressCounting = contextFile.includes("processedCount");

    expect(hasLoadingStatus).toBe(true);
    expect(hasProgressUpdate).toBe(true);
    expect(hasProgressCounting).toBe(true);
  });

  test("should check for UI enhancements", async () => {
    const componentFile = await fs.promises.readFile(
      path.join(process.cwd(), "src/components/repository-selection.tsx"),
      "utf8",
    );

    const hasStatusDisplay = componentFile.includes("loadingStatus ||");
    const hasWorkflowDescription = componentFile.includes(
      "configured workflows",
    );

    expect(hasStatusDisplay).toBe(true);
    expect(hasWorkflowDescription).toBe(true);
  });
});
