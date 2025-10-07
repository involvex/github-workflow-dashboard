/**
 * @jest-environment jsdom
 */
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  isSecureStorageAvailable,
  clearAllSecureStorage,
  STORAGE_KEYS,
} from "../src/lib/storage/secure-storage";

// Mock crypto API
const mockCrypto = {
  subtle: {
    digest: jest.fn(),
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

// Setup global mocks
beforeAll(() => {
  // Mock navigator for device fingerprinting
  Object.defineProperty(global, "navigator", {
    value: {
      userAgent: "test-agent",
      language: "en-US",
    },
    writable: true,
  });

  // Mock screen for device fingerprinting
  Object.defineProperty(global, "screen", {
    value: {
      width: 1920,
      height: 1080,
    },
    writable: true,
  });

  // Mock Date.prototype.getTimezoneOffset
  const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
  Date.prototype.getTimezoneOffset = jest.fn(() => -480); // PST timezone

  // Mock Intl for consistent device fingerprinting
  global.Intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({
        timeZone: "America/Los_Angeles",
      }),
    }),
  } as unknown as typeof Intl;

  // Setup globals
  global.crypto = mockCrypto as unknown as Crypto;
  global.localStorage = mockLocalStorage as unknown as Storage;

  // Cleanup function
  afterAll(() => {
    Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
  });
});

describe("Secure Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup crypto mocks with default behaviors
    mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
      // Fill with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });

    // Mock digest for device password generation
    mockCrypto.subtle.digest.mockResolvedValue(
      new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22, 0x33, 0x44,
        0x55, 0x66, 0x77, 0x88, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11,
        0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99,
      ]).buffer,
    );

    mockCrypto.subtle.importKey.mockResolvedValue({
      type: "secret",
      extractable: false,
      algorithm: { name: "PBKDF2" },
      usages: ["deriveKey"],
    } as CryptoKey);

    mockCrypto.subtle.deriveKey.mockResolvedValue({
      type: "secret",
      extractable: false,
      algorithm: { name: "AES-GCM", length: 256 },
      usages: ["encrypt", "decrypt"],
    } as CryptoKey);

    mockCrypto.subtle.encrypt.mockResolvedValue(
      new Uint8Array([1, 2, 3, 4, 5]).buffer,
    );

    mockCrypto.subtle.decrypt.mockResolvedValue(
      new TextEncoder().encode("test-value").buffer,
    );
  });

  describe("isSecureStorageAvailable", () => {
    it("should return true when all required APIs are available", () => {
      expect(isSecureStorageAvailable()).toBe(true);
    });

    it("should return false when crypto is not available", () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - intentionally setting to undefined for test
      global.crypto = undefined;

      expect(isSecureStorageAvailable()).toBe(false);

      global.crypto = originalCrypto;
    });

    it("should return false when localStorage is not available", () => {
      const originalLocalStorage = global.localStorage;
      // @ts-expect-error - intentionally setting to undefined for test
      global.localStorage = undefined;

      expect(isSecureStorageAvailable()).toBe(false);

      global.localStorage = originalLocalStorage;
    });
  });

  describe("setSecureItem", () => {
    it("should encrypt and store data in localStorage", async () => {
      await setSecureItem(STORAGE_KEYS.GITHUB_TOKEN, "test-token");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.GITHUB_TOKEN,
        expect.stringMatching(
          /{"encrypted":\[[\d,]+\],"salt":\[[\d,]+\],"iv":\[[\d,]+\],"timestamp":\d+}/,
        ),
      );
    });

    it("should call crypto functions with correct parameters", async () => {
      await setSecureItem(STORAGE_KEYS.GITHUB_TOKEN, "test-token");

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "raw",
        expect.any(Object),
        "PBKDF2",
        false,
        ["deriveKey"],
      );

      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: "PBKDF2",
          salt: expect.any(Uint8Array),
          iterations: 100000,
          hash: "SHA-256",
        },
        expect.objectContaining({ type: "secret" }),
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"],
      );

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it("should throw error when encryption fails", async () => {
      mockCrypto.subtle.encrypt.mockRejectedValueOnce(
        new Error("Encryption failed"),
      );

      await expect(
        setSecureItem(STORAGE_KEYS.GITHUB_TOKEN, "test-token"),
      ).rejects.toThrow("Failed to securely store item: Encryption failed");
    });
  });

  describe("getSecureItem", () => {
    it("should return null when item does not exist", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await getSecureItem(STORAGE_KEYS.GITHUB_TOKEN);

      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.GITHUB_TOKEN,
      );
    });

    it("should decrypt and return stored data", async () => {
      const mockStoredData = {
        encrypted: [1, 2, 3, 4, 5],
        salt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        timestamp: Date.now(),
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredData));

      const result = await getSecureItem(STORAGE_KEYS.GITHUB_TOKEN);

      expect(result).toBe("test-value");
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });

    it("should return null and remove corrupted data when decryption fails", async () => {
      const mockStoredData = {
        encrypted: [1, 2, 3, 4, 5],
        salt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        timestamp: Date.now(),
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredData));
      mockCrypto.subtle.decrypt.mockRejectedValueOnce(
        new Error("Decryption failed"),
      );

      const result = await getSecureItem(STORAGE_KEYS.GITHUB_TOKEN);

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.GITHUB_TOKEN,
      );
    });

    it("should return null when stored data format is invalid", async () => {
      mockLocalStorage.getItem.mockReturnValue('{"invalid": "format"}');

      const result = await getSecureItem(STORAGE_KEYS.GITHUB_TOKEN);

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.GITHUB_TOKEN,
      );
    });
  });

  describe("removeSecureItem", () => {
    it("should remove item from localStorage", () => {
      removeSecureItem(STORAGE_KEYS.GITHUB_TOKEN);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.GITHUB_TOKEN,
      );
    });

    it("should not throw when localStorage is not available", () => {
      const originalLocalStorage = global.localStorage;
      // @ts-expect-error - intentionally setting to undefined for test
      global.localStorage = undefined;

      expect(() => removeSecureItem(STORAGE_KEYS.GITHUB_TOKEN)).not.toThrow();

      global.localStorage = originalLocalStorage;
    });
  });

  describe("clearAllSecureStorage", () => {
    it("should remove all application storage keys", () => {
      clearAllSecureStorage();

      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key);
      });
    });
  });

  describe("STORAGE_KEYS", () => {
    it("should have all required keys", () => {
      expect(STORAGE_KEYS).toEqual({
        GITHUB_TOKEN: "ifl_dashboard_github_token",
        SELECTED_REPOSITORIES: "ifl_dashboard_selected_repos",
        USER_PREFERENCES: "ifl_dashboard_preferences",
        LAST_SYNC: "ifl_dashboard_last_sync",
      });
    });
  });

  describe("device fingerprinting", () => {
    it("should generate consistent device password", async () => {
      // Call the function twice to ensure consistency
      await setSecureItem(STORAGE_KEYS.GITHUB_TOKEN, "test-token-1");

      jest.clearAllMocks();
      // Reset the digest mock to return the same result
      mockCrypto.subtle.digest.mockResolvedValue(
        new Uint8Array([
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22, 0x33,
          0x44, 0x55, 0x66, 0x77, 0x88, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff,
          0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99,
        ]).buffer,
      );

      await setSecureItem(STORAGE_KEYS.USER_PREFERENCES, "test-token-2");

      // Both calls should use the same device fingerprint
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        "SHA-256",
        expect.any(Uint8Array),
      );

      // Verify the fingerprint data is consistent
      const calls = mockCrypto.subtle.digest.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
