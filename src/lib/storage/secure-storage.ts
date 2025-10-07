/**
 * Secure Storage Utilities
 * Provides encrypted localStorage with device fingerprinting
 */

// Storage keys for the GitHub Workflow Dashboard application
export const STORAGE_KEYS = {
  GITHUB_TOKEN: "github_flow_dashboard_token",
  GITHUB_USER_ID: "github_flow_dashboard_user_id",
  SELECTED_REPOSITORIES: "github_flow_dashboard_selected_repos",
  USER_PREFERENCES: "github_flow_dashboard_preferences",
  LAST_SYNC: "github_flow_dashboard_last_sync",
} as const;

// Helper to get localStorage reference that works in both browser and test environments
function getLocalStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  // For testing environments
  if (typeof global !== "undefined" && global.localStorage) {
    return global.localStorage;
  }
  return null;
}

// Helper to get crypto reference that works in both browser and test environments
function getCrypto() {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  // For testing environments
  if (typeof global !== "undefined" && global.crypto) {
    return global.crypto;
  }
  return null;
}

/**
 * Device fingerprinting for consistent encryption keys
 * This generates a device-specific password based on available browser information
 * without requiring user input, enabling automatic decryption on the same device
 */
async function getDevicePassword(): Promise<string> {
  const crypto = getCrypto();
  if (!crypto) throw new Error("Crypto API not available");

  // Create a fingerprint from available browser/device info
  const fingerprint = [
    navigator.userAgent || "unknown",
    navigator.language || "unknown",
    screen.width + "x" + screen.height || "unknown",
    new Date().getTimezoneOffset().toString() || "0",
    // Add more stable identifiers as needed
    "github-flow-dashboard-v1", // App-specific salt
  ].join("|");

  // Hash the fingerprint to create a consistent device password
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return "pwd_" + hashHex.slice(0, 32); // Use first 32 chars with prefix
}

/**
 * Check if secure storage is available in the browser
 */
export function isSecureStorageAvailable(): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return false;

    const crypto = getCrypto();
    const localStorage = getLocalStorage();

    // Check for crypto API
    if (!crypto || !("subtle" in crypto)) return false;

    // Check for localStorage availability and functionality
    if (!localStorage) return false;

    // Test localStorage functionality
    const testKey = "__test_storage__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);

    return true;
  } catch {
    return false;
  }
}

/**
 * Securely store encrypted data in localStorage
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    const crypto = getCrypto();
    const localStorage = getLocalStorage();

    if (!crypto || !localStorage) {
      throw new Error("Secure storage not available");
    }

    // Generate device-specific password
    const devicePassword = await getDevicePassword();

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from device password and salt
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(devicePassword),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );

    // Encrypt the value
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      derivedKey,
      new TextEncoder().encode(value),
    );

    // Store encrypted data with metadata
    const storageData = {
      encrypted: Array.from(new Uint8Array(encryptedData)),
      salt: Array.from(salt),
      iv: Array.from(iv),
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(storageData));
  } catch (error) {
    throw new Error(
      `Failed to securely store item: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Retrieve and decrypt data from localStorage
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const crypto = getCrypto();
    const localStorage = getLocalStorage();

    if (!crypto || !localStorage) {
      return null;
    }

    const storedData = localStorage.getItem(key);
    if (!storedData) {
      return null;
    }

    const { encrypted, salt, iv } = JSON.parse(storedData);

    // Validate data format
    if (
      !encrypted ||
      !salt ||
      !iv ||
      !Array.isArray(encrypted) ||
      !Array.isArray(salt) ||
      !Array.isArray(iv)
    ) {
      throw new Error("Invalid storage format");
    }

    // Generate device-specific password
    const devicePassword = await getDevicePassword();

    // Derive the same key used for encryption
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(devicePassword),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      derivedKey,
      new Uint8Array(encrypted),
    );

    return new TextDecoder().decode(decryptedData);
  } catch {
    // If decryption fails, remove the corrupted data
    const localStorage = getLocalStorage();
    if (localStorage) {
      localStorage.removeItem(key);
    }
    return null;
  }
}

/**
 * Remove encrypted data from localStorage
 */
export function removeSecureItem(key: string): void {
  try {
    const localStorage = getLocalStorage();
    if (localStorage) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore errors when removing items
  }
}

/**
 * Clear all application data from localStorage
 */
export function clearAllSecureStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeSecureItem(key);
  });
}
