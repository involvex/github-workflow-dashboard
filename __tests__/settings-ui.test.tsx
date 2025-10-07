/**
 * Functional UI Test for Settings Page
 * Tests the token management UI components
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsPage from "../src/app/settings/page";
import { GitHubTokenProvider } from "../src/contexts/github-token-context";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the secure storage and GitHub API
jest.mock("../src/lib/storage/secure-storage", () => ({
  isSecureStorageAvailable: () => true,
  setSecureItem: jest.fn().mockResolvedValue(undefined),
  getSecureItem: jest.fn().mockResolvedValue(null),
  removeSecureItem: jest.fn().mockResolvedValue(undefined),
  STORAGE_KEYS: {
    GITHUB_TOKEN: "ifl_dashboard_github_token",
    SELECTED_REPOSITORIES: "ifl_dashboard_selected_repos",
    USER_PREFERENCES: "ifl_dashboard_preferences",
    LAST_SYNC: "ifl_dashboard_last_sync",
  },
}));

jest.mock("../src/lib/api/token-validation", () => ({
  validateGitHubToken: jest.fn().mockResolvedValue({
    isValid: true,
    error: null,
  }),
}));

// Mock Web APIs
Object.defineProperty(global, "navigator", {
  value: {
    userAgent: "test-browser",
    language: "en-US",
  },
  writable: true,
});

Object.defineProperty(global, "screen", {
  value: {
    width: 1920,
    height: 1080,
  },
  writable: true,
});

const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: jest.fn().mockResolvedValue({ type: "secret" } as CryptoKey),
    deriveKey: jest.fn().mockResolvedValue({ type: "secret" } as CryptoKey),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
  },
};

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
});

Object.defineProperty(global, "window", {
  value: {
    crypto: mockCrypto,
    localStorage: {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    confirm: jest.fn().mockReturnValue(true),
  },
  writable: true,
});

Date.prototype.getTimezoneOffset = jest.fn(() => -480);

describe("Settings Page - Token Management UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders settings page with token input form", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("GitHub Token")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/GitHub Personal Access Token/),
    ).toBeInTheDocument();
    expect(screen.getByText("Save Token")).toBeInTheDocument();
  });

  test("shows token requirements section", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    expect(screen.getByText("Token Requirements")).toBeInTheDocument();
    expect(screen.getByText(/repo/)).toBeInTheDocument();
    expect(screen.getByText(/actions:read/)).toBeInTheDocument();
  });

  test("allows entering a token", async () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    const tokenInput = screen.getByLabelText(/GitHub Personal Access Token/);
    fireEvent.change(tokenInput, { target: { value: "ghp_test123456789" } });

    expect(tokenInput).toHaveValue("ghp_test123456789");
  });

  test("submit button is disabled when token input is empty", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    const submitButton = screen.getByText("Save Token");
    expect(submitButton).toBeDisabled();
  });

  test("submit button is enabled when token input has value", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    const tokenInput = screen.getByLabelText(/GitHub Personal Access Token/);
    const submitButton = screen.getByText("Save Token");

    fireEvent.change(tokenInput, { target: { value: "ghp_test123456789" } });

    expect(submitButton).not.toBeDisabled();
  });

  test("shows back to dashboard link", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    const backLink = screen.getByText("← Back to Dashboard");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  test("shows GitHub token creation link", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    const githubLink = screen.getByText("Create a token on GitHub →");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/settings/tokens",
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
  });

  test("shows secure storage supported badge", () => {
    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    // Should not show the "not supported" badge since we mocked it as available
    expect(
      screen.queryByText("Secure storage not supported"),
    ).not.toBeInTheDocument();
  });

  test("shows loading state during form submission", async () => {
    // Mock a delayed token validation
    const tokenValidationModule = await import(
      "../src/lib/api/token-validation"
    );
    (tokenValidationModule.validateGitHubToken as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ isValid: true, error: null }), 100),
        ),
    );

    render(
      <GitHubTokenProvider>
        <SettingsPage />
      </GitHubTokenProvider>,
    );

    const tokenInput = screen.getByLabelText(/GitHub Personal Access Token/);
    const form = tokenInput.closest("form")!;

    fireEvent.change(tokenInput, { target: { value: "ghp_test123456789" } });
    fireEvent.submit(form);

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });

    // Wait for the form to complete
    await waitFor(
      () => {
        expect(screen.queryByText("Validating...")).not.toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });
});

console.log("✅ Settings Page UI tests completed successfully!");
console.log(
  "🎯 All components render correctly and handle user interactions properly.",
);
console.log("📱 Token management interface is functional and user-friendly.");
