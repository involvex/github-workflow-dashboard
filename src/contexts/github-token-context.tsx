/**
 * GitHub Token Context
 * Manages GitHub token state and provides secure storage integration
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  isSecureStorageAvailable,
  STORAGE_KEYS,
} from "@/lib/storage/secure-storage";
import { validateGitHubToken } from "@/lib/api/token-validation";

interface GitHubTokenContextType {
  token: string | null;
  isValidated: boolean;
  isLoading: boolean;
  error: string | null;
  userId?: string | null;
  setToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  isSecureStorageSupported: boolean;
}

const GitHubTokenContext = createContext<GitHubTokenContextType | undefined>(
  undefined,
);

interface GitHubTokenProviderProps {
  children: ReactNode;
}

export function GitHubTokenProvider({ children }: GitHubTokenProviderProps) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSecureStorageSupported, setIsSecureStorageSupported] =
    useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check secure storage availability on mount
  useEffect(() => {
    setIsSecureStorageSupported(isSecureStorageAvailable());
  }, []);

  // Load token from secure storage on mount
  useEffect(() => {
    async function loadStoredToken() {
      console.log("[GitHub Token Context] Loading stored token...");
      if (!isSecureStorageSupported) {
        console.log(
          "[GitHub Token Context] Secure storage not supported, skipping token load",
        );
        setIsLoading(false);
        return;
      }

      try {
        const storedToken = await getSecureItem(STORAGE_KEYS.GITHUB_TOKEN);
        console.log(
          "[GitHub Token Context] Stored token found:",
          !!storedToken,
        );

        if (storedToken) {
          setTokenState(storedToken);
          // Validate the stored token
          console.log("[GitHub Token Context] Validating stored token...");
          const validation = await validateGitHubToken(storedToken);
          console.log(
            "[GitHub Token Context] Stored token validation result:",
            validation,
          );

          setIsValidated(validation.isValid);
          if (!validation.isValid) {
            console.warn(
              "[GitHub Token Context] Stored token is no longer valid",
            );
            setError("Stored token is no longer valid");
          } else {
            console.log("[GitHub Token Context] Stored token is valid");
            // load stored userId if available
            try {
              const storedUserId = await getSecureItem(
                STORAGE_KEYS.GITHUB_USER_ID,
              );
              if (storedUserId) {
                setUserId(storedUserId as string);
              }
            } catch (err) {
              console.warn(
                "[GitHub Token Context] Failed to load stored userId",
                err,
              );
            }
          }
        } else {
          console.log("[GitHub Token Context] No stored token found");
        }
      } catch (err) {
        console.error(
          "[GitHub Token Context] Failed to load stored token:",
          err,
        );
        setError("Failed to load stored token");
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredToken();
  }, [isSecureStorageSupported]);

  const setToken = async (newToken: string): Promise<void> => {
    console.log("[GitHub Token Context] Setting token...");
    setError(null);
    setIsLoading(true);

    try {
      // Validate the token first
      console.log("[GitHub Token Context] Validating token...");
      const validation = await validateGitHubToken(newToken);
      console.log(
        "[GitHub Token Context] Token validation result:",
        validation,
      );

      if (!validation.isValid) {
        console.error(
          "[GitHub Token Context] Token validation failed:",
          validation.error,
        );
        throw new Error(validation.error || "Invalid GitHub token");
      }

      // Store the token securely if storage is available
      if (isSecureStorageSupported) {
        console.log("[GitHub Token Context] Storing token securely...");
        await setSecureItem(STORAGE_KEYS.GITHUB_TOKEN, newToken);
      } else {
        console.log(
          "[GitHub Token Context] Secure storage not available, token will not persist",
        );
      }

      setTokenState(newToken);
      setIsValidated(true);
      // Fetch authenticated user id and store it
      try {
        const res = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `token ${newToken}`,
            Accept: "application/vnd.github+json",
          },
        });

        if (!res.ok) {
          console.warn(
            "[GitHub Token Context] Failed to fetch user info",
            res.status,
          );
        } else {
          const data = await res.json();
          const login = data && (data.login || data.id);
          if (login) {
            setUserId(login);
            if (isSecureStorageSupported) {
              await setSecureItem(STORAGE_KEYS.GITHUB_USER_ID, login);
            }
          }
        }
      } catch (err) {
        console.warn("[GitHub Token Context] Error fetching user info", err);
      }
      console.log(
        "[GitHub Token Context] Token successfully set and validated",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to set token";
      console.error("[GitHub Token Context] Error setting token:", err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeToken = async (): Promise<void> => {
    setError(null);

    try {
      if (isSecureStorageSupported) {
        await removeSecureItem(STORAGE_KEYS.GITHUB_TOKEN);
        await removeSecureItem(STORAGE_KEYS.GITHUB_USER_ID);
      }

      setTokenState(null);
      setUserId(null);
      setIsValidated(false);
    } catch (err) {
      console.error("Failed to remove token:", err);
      setError("Failed to remove token");
    }
  };

  const validateToken = async (): Promise<boolean> => {
    if (!token) {
      setIsValidated(false);
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      const validation = await validateGitHubToken(token);
      setIsValidated(validation.isValid);

      if (!validation.isValid) {
        setError(validation.error || "Token validation failed");
      }

      return validation.isValid;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Token validation failed";
      setError(message);
      setIsValidated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: GitHubTokenContextType = {
    token,
    isValidated,
    isLoading,
    error,
    userId,
    setToken,
    removeToken,
    validateToken,
    isSecureStorageSupported,
  };

  return (
    <GitHubTokenContext.Provider value={contextValue}>
      {children}
    </GitHubTokenContext.Provider>
  );
}

export function useGitHubToken(): GitHubTokenContextType {
  const context = useContext(GitHubTokenContext);
  if (context === undefined) {
    throw new Error("useGitHubToken must be used within a GitHubTokenProvider");
  }
  return context;
}
