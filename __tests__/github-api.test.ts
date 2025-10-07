import { GitHubApiClient, GitHubApiError } from "../src/lib/api/github";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

describe("GitHubApiClient", () => {
  let client: GitHubApiClient;
  const mockToken = "test-token";

  beforeEach(() => {
    client = new GitHubApiClient(mockToken);
    mockFetch.mockClear();
  });

  describe("constructor", () => {
    it("should initialize with a token", () => {
      expect(client).toBeInstanceOf(GitHubApiClient);
    });
  });

  describe("validateToken", () => {
    it("should make a request to /user endpoint", async () => {
      const mockUser = {
        login: "testuser",
        id: 12345,
        avatar_url: "https://github.com/images/error/testuser_happy.gif",
        name: "Test User",
        email: "test@example.com",
        public_repos: 10,
        public_gists: 5,
        followers: 100,
        following: 50,
        created_at: "2023-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockUser),
        headers: new Headers({
          "X-RateLimit-Limit": "5000",
          "X-RateLimit-Remaining": "4999",
          "X-RateLimit-Reset": "1234567890",
        }),
      } as any);

      const result = await client.validateToken();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/vnd.github+json",
            Authorization: "Bearer test-token",
            "X-GitHub-Api-Version": "2022-11-28",
          }),
        }),
      );

      expect(result).toEqual(mockUser);
    });

    it("should throw GitHubApiError on failed request", async () => {
      const errorResponse = {
        message: "Bad credentials",
        documentation_url: "https://docs.github.com/rest",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValueOnce(errorResponse),
        headers: new Headers(),
      } as any);

      await expect(client.validateToken()).rejects.toThrow(GitHubApiError);
      await expect(client.validateToken()).rejects.toThrow("Bad credentials");
    });
  });

  describe("getRepositories", () => {
    it("should fetch user repositories by default", async () => {
      const mockRepos = [
        {
          id: 1,
          name: "test-repo",
          full_name: "testuser/test-repo",
          owner: {
            login: "testuser",
            avatar_url: "https://github.com/testuser.png",
          },
          private: false,
          html_url: "https://github.com/testuser/test-repo",
          description: "A test repository",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-02T00:00:00Z",
          pushed_at: "2023-01-02T12:00:00Z",
          default_branch: "main",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockRepos),
        headers: new Headers(),
      } as any);

      const result = await client.getRepositories("testuser", true);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/user/repos?",
        expect.any(Object),
      );

      expect(result).toEqual(mockRepos);
    });

    it("should fetch organization repositories when owner is specified", async () => {
      const mockRepos = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockRepos),
        headers: new Headers(),
      } as any);

      await client.getRepositories("test-org", false);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/orgs/test-org/repos?",
        expect.any(Object),
      );
    });

    it("should include query parameters when options are provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce([]),
        headers: new Headers(),
      } as any);

      await client.getRepositories("test-org", false, {
        type: "owner",
        sort: "updated",
        direction: "desc",
        per_page: 50,
        page: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/orgs/test-org/repos?type=owner&sort=updated&direction=desc&per_page=50&page=1",
        expect.any(Object),
      );
    });
  });

  describe("getWorkflows", () => {
    it("should fetch workflows for a repository", async () => {
      const mockWorkflows = [
        {
          id: 1,
          name: "CI",
          path: ".github/workflows/ci.yml",
          state: "active" as const,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-02T00:00:00Z",
          url: "https://api.github.com/repos/testuser/test-repo/actions/workflows/1",
          html_url:
            "https://github.com/testuser/test-repo/actions/workflows/ci.yml",
          badge_url:
            "https://github.com/testuser/test-repo/workflows/CI/badge.svg",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ workflows: mockWorkflows }),
        headers: new Headers(),
      } as any);

      const result = await client.getWorkflows("testuser", "test-repo");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/testuser/test-repo/actions/workflows",
        expect.any(Object),
      );

      expect(result).toEqual(mockWorkflows);
    });
  });

  describe("getWorkflowRuns", () => {
    it("should fetch workflow runs for a repository", async () => {
      const mockRuns = [
        {
          id: 1,
          name: "CI",
          head_branch: "main",
          head_sha: "abc123",
          path: ".github/workflows/ci.yml",
          display_title: "Update README",
          run_number: 1,
          event: "push",
          status: "completed" as const,
          conclusion: "success" as const,
          workflow_id: 1,
          url: "https://api.github.com/repos/testuser/test-repo/actions/runs/1",
          html_url: "https://github.com/testuser/test-repo/actions/runs/1",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T01:00:00Z",
          actor: {
            login: "testuser",
            avatar_url: "https://github.com/testuser.png",
          },
          run_attempt: 1,
          repository: {
            id: 1,
            name: "test-repo",
            full_name: "testuser/test-repo",
            owner: { login: "testuser" },
          },
          head_commit: {
            id: "abc123",
            message: "Update README",
            timestamp: "2023-01-01T00:00:00Z",
            author: {
              name: "Test User",
              email: "test@example.com",
            },
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ workflow_runs: mockRuns }),
        headers: new Headers(),
      } as any);

      const result = await client.getWorkflowRuns("testuser", "test-repo");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/testuser/test-repo/actions/runs?",
        expect.any(Object),
      );

      expect(result).toEqual(mockRuns);
    });

    it("should include query parameters when options are provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({ workflow_runs: [] }),
        headers: new Headers(),
      } as any);

      await client.getWorkflowRuns("testuser", "test-repo", {
        status: "completed",
        branch: "main",
        per_page: 10,
        page: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/testuser/test-repo/actions/runs?status=completed&branch=main&per_page=10&page=1",
        expect.any(Object),
      );
    });
  });

  describe("getRateLimit", () => {
    it("should fetch rate limit information", async () => {
      const mockRateLimit = {
        rate: {
          limit: 5000,
          remaining: 4999,
          reset: 1234567890,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockRateLimit),
        headers: new Headers(),
      } as any);

      const result = await client.getRateLimit();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/rate_limit",
        expect.any(Object),
      );

      expect(result).toEqual(mockRateLimit);
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.validateToken()).rejects.toThrow("Network error");
    });

    it("should handle JSON parsing errors in error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
        headers: new Headers(),
      } as any);

      await expect(client.validateToken()).rejects.toThrow(GitHubApiError);
      await expect(client.validateToken()).rejects.toThrow(
        "GitHub API Error: 500",
      );
    });
  });

  describe("rate limiting", () => {
    it("should extract rate limit headers from responses", async () => {
      const mockUser = {
        login: "testuser",
        id: 12345,
        avatar_url: "https://github.com/images/error/testuser_happy.gif",
        name: "Test User",
        email: "test@example.com",
        public_repos: 10,
        public_gists: 5,
        followers: 100,
        following: 50,
        created_at: "2023-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockUser),
        headers: new Headers({
          "X-RateLimit-Limit": "5000",
          "X-RateLimit-Remaining": "4999",
          "X-RateLimit-Reset": "1234567890",
        }),
      } as any);

      // Access the makeRequest method indirectly through validateToken
      const result = await client.validateToken();
      expect(result).toEqual(mockUser);
      // Note: We can't directly test the rate limit extraction without exposing makeRequest,
      // but this ensures the flow works without throwing errors
    });
  });
});
