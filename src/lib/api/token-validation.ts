import { GitHubApiClient } from "./github";

export interface TokenValidationResult {
  isValid: boolean;
  user?: {
    login: string;
    name: string | null;
    avatar_url: string;
  };
  error?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

/**
 * Validates a GitHub personal access token by making a test API call
 * @param token - GitHub personal access token
 * @returns Promise<TokenValidationResult> - Validation result with user info or error
 */
export async function validateGitHubToken(
  token: string,
): Promise<TokenValidationResult> {
  if (!token || token.trim().length === 0) {
    return {
      isValid: false,
      error: "Token is required",
    };
  }

  try {
    const client = new GitHubApiClient(token);
    const user = await client.validateToken();

    return {
      isValid: true,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        isValid: false,
        error: error.message,
      };
    }

    return {
      isValid: false,
      error: "Unknown error occurred during token validation",
    };
  }
}

/**
 * Quick check if a token format looks valid (basic format validation only)
 * @param token - Token string to validate
 * @returns boolean - Whether the token format appears valid
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // GitHub Personal Access Tokens typically start with 'ghp_' and are 40+ chars
  // GitHub App tokens start with 'ghs_'
  // Classic tokens are 40 hex characters
  const trimmedToken = token.trim();

  // Check for new format tokens
  if (trimmedToken.startsWith("ghp_") || trimmedToken.startsWith("ghs_")) {
    return trimmedToken.length >= 40;
  }

  // Check for classic format (40 hex characters)
  if (trimmedToken.length === 40 && /^[a-f0-9]{40}$/i.test(trimmedToken)) {
    return true;
  }

  return false;
}
