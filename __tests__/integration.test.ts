import { GitHubApiClient } from "../src/lib/api/github";
import {
  validateGitHubToken,
  isValidTokenFormat,
} from "../src/lib/api/token-validation";

/**
 * Manual test script for GitHub API integration
 * Run with: npm run test:integration
 *
 * Set GH_TOKEN environment variable to test with real token
 */
describe("GitHub API Integration", () => {
  test("validates token formats correctly", () => {
    expect(isValidTokenFormat("a".repeat(40))).toBe(true);
    expect(isValidTokenFormat("ghp_" + "a".repeat(36))).toBe(true);
    expect(isValidTokenFormat("invalid")).toBe(false);
    expect(isValidTokenFormat("")).toBe(false);
  });

  test("can create GitHub API client", () => {
    const client = new GitHubApiClient("test-token");
    expect(client).toBeInstanceOf(GitHubApiClient);
  });
});

async function testGitHubApiIntegration() {
  console.log("🧪 Testing GitHub API Integration...\n");

  // Test token format validation
  console.log("📝 Testing token format validation:");
  console.log(
    "Valid classic token format:",
    isValidTokenFormat("a".repeat(40)),
  );
  console.log(
    "Valid new token format:",
    isValidTokenFormat("ghp_" + "a".repeat(36)),
  );
  console.log("Invalid token format:", isValidTokenFormat("invalid"));
  console.log("Empty token:", isValidTokenFormat(""));
  console.log();

  // Get token from environment
  const token = process.env.GH_TOKEN;

  if (!token) {
    console.log("⚠️  No GH_TOKEN environment variable found.");
    console.log(
      "To test with a real token, set GH_TOKEN=your_token and run again.",
    );
    console.log();
    console.log("✅ Basic validation tests completed.");
    return;
  }

  console.log("🔑 Testing with provided GitHub token...");

  try {
    // Test token validation
    console.log("Validating token...");
    const validationResult = await validateGitHubToken(token);

    if (validationResult.isValid) {
      console.log("✅ Token is valid!");
      console.log(
        `User: ${validationResult.user?.name || validationResult.user?.login}`,
      );
      console.log(`Login: ${validationResult.user?.login}`);
    } else {
      console.log("❌ Token validation failed:", validationResult.error);
      return;
    }

    // Test API client directly
    console.log("\n🔄 Testing API client...");
    const client = new GitHubApiClient(token);

    // Test rate limit
    console.log("Checking rate limit...");
    const rateLimit = await client.getRateLimit();
    console.log(
      `Rate limit: ${rateLimit.rate.remaining}/${rateLimit.rate.limit} remaining`,
    );

    // Test repositories fetch
    console.log("Fetching user repositories...");
    const repos = await client.getRepositories(
      validationResult.user!.login,
      true,
      { per_page: 5 },
    );
    console.log(`Found ${repos.length} repositories (showing first 5)`);

    if (repos.length > 0) {
      console.log("Sample repository:", repos[0].full_name);

      // Test workflows for first repository
      const [owner, repo] = repos[0].full_name.split("/");
      console.log(`\nFetching workflows for ${owner}/${repo}...`);

      try {
        const workflows = await client.getWorkflows(owner, repo);
        console.log(`Found ${workflows.length} workflows`);

        if (workflows.length > 0) {
          console.log("Sample workflow:", workflows[0].name);

          // Test workflow runs
          console.log("Fetching recent workflow runs...");
          const runs = await client.getWorkflowRuns(owner, repo, {
            per_page: 3,
          });
          console.log(`Found ${runs.length} recent runs`);

          if (runs.length > 0) {
            console.log(
              "Latest run status:",
              runs[0].status,
              runs[0].conclusion,
            );
          }
        }
      } catch {
        console.log(
          "Note: Could not fetch workflows (possibly no Actions enabled)",
        );
      }
    }

    console.log("\n✅ All API integration tests completed successfully!");
  } catch (error) {
    console.error("❌ API integration test failed:", error);
  }
}

export { testGitHubApiIntegration };
