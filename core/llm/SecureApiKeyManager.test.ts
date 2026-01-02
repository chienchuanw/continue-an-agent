/**
 * Tests for SecureApiKeyManager
 *
 * This service manages API keys using VSCode Secret Storage instead of plain text config files.
 * Following TDD: write tests first, then implementation.
 */

import { SecureApiKeyManager } from "./SecureApiKeyManager.js";

/**
 * Mock IDE interface for testing
 */
class MockIDE {
  private storage: Map<string, string> = new Map();

  async readSecrets(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const value = this.storage.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  async writeSecrets(secrets: { [key: string]: string }): Promise<void> {
    for (const [key, value] of Object.entries(secrets)) {
      this.storage.set(key, value);
    }
  }

  // Helper for testing
  clear() {
    this.storage.clear();
  }
}

describe("SecureApiKeyManager", () => {
  let mockIDE: MockIDE;
  let manager: SecureApiKeyManager;

  beforeEach(() => {
    mockIDE = new MockIDE();
    manager = new SecureApiKeyManager(mockIDE as any);
  });

  afterEach(() => {
    mockIDE.clear();
  });

  describe("storeApiKey", () => {
    it("should store API key securely", async () => {
      await manager.storeApiKey("anthropic", "sk-ant-test-key");

      const key = await manager.getApiKey("anthropic");
      expect(key).toBe("sk-ant-test-key");
    });

    it("should overwrite existing API key", async () => {
      await manager.storeApiKey("anthropic", "old-key");
      await manager.storeApiKey("anthropic", "new-key");

      const key = await manager.getApiKey("anthropic");
      expect(key).toBe("new-key");
    });

    it("should store multiple provider keys", async () => {
      await manager.storeApiKey("anthropic", "sk-ant-key");
      await manager.storeApiKey("openai", "sk-openai-key");

      const anthropicKey = await manager.getApiKey("anthropic");
      const openaiKey = await manager.getApiKey("openai");

      expect(anthropicKey).toBe("sk-ant-key");
      expect(openaiKey).toBe("sk-openai-key");
    });
  });

  describe("getApiKey", () => {
    it("should return undefined for non-existent key", async () => {
      const key = await manager.getApiKey("nonexistent");
      expect(key).toBeUndefined();
    });

    it("should retrieve stored API key", async () => {
      await manager.storeApiKey("anthropic", "test-key");

      const key = await manager.getApiKey("anthropic");
      expect(key).toBe("test-key");
    });
  });

  describe("deleteApiKey", () => {
    it("should delete API key", async () => {
      await manager.storeApiKey("anthropic", "test-key");
      await manager.deleteApiKey("anthropic");

      const key = await manager.getApiKey("anthropic");
      expect(key).toBeUndefined();
    });

    it("should not throw when deleting non-existent key", async () => {
      await expect(manager.deleteApiKey("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("hasApiKey", () => {
    it("should return true for existing key", async () => {
      await manager.storeApiKey("anthropic", "test-key");

      const has = await manager.hasApiKey("anthropic");
      expect(has).toBe(true);
    });

    it("should return false for non-existent key", async () => {
      const has = await manager.hasApiKey("nonexistent");
      expect(has).toBe(false);
    });
  });

  describe("listProviders", () => {
    it("should return empty array when no keys stored", async () => {
      const providers = await manager.listProviders();
      expect(providers).toEqual([]);
    });

    it("should return list of providers with stored keys", async () => {
      await manager.storeApiKey("anthropic", "key1");
      await manager.storeApiKey("openai", "key2");

      const providers = await manager.listProviders();
      expect(providers).toContain("anthropic");
      expect(providers).toContain("openai");
      expect(providers.length).toBe(2);
    });
  });

  describe("key naming convention", () => {
    it("should use consistent key format", async () => {
      await manager.storeApiKey("anthropic", "test-key");

      // The key should be stored with a consistent prefix
      const secrets = await mockIDE.readSecrets(["continue.apiKey.anthropic"]);
      expect(secrets["continue.apiKey.anthropic"]).toBe("test-key");
    });
  });
});
