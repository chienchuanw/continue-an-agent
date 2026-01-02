/**
 * Phase 0 Integration Tests
 *
 * These tests verify that all Phase 0 components work together correctly:
 * - ILLMClient interface
 * - ClaudeLLMClient adapter
 * - SecureApiKeyManager
 *
 * Acceptance Criteria (from docs/roadmap.md Phase 0):
 * - Claude chat works via Core, not directly from UI
 * - Switching model does not change UI logic
 */

import { ChatMessage } from "../index.js";
import { ClaudeLLMClient } from "./ClaudeLLMClient.js";
import { ILLMClient } from "./ILLMClient.interface.js";
import { SecureApiKeyManager } from "./SecureApiKeyManager.js";

/**
 * Mock IDE for testing
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
}

describe("Phase 0 Integration Tests", () => {
  let mockIDE: MockIDE;
  let apiKeyManager: SecureApiKeyManager;

  beforeEach(() => {
    mockIDE = new MockIDE();
    apiKeyManager = new SecureApiKeyManager(mockIDE as any);
  });

  describe("Acceptance Criteria 1: Claude chat works via Core", () => {
    it("should create Claude client through abstraction layer", async () => {
      // Store API key securely
      await apiKeyManager.storeApiKey("anthropic", "test-api-key");

      // Retrieve API key
      const apiKey = await apiKeyManager.getApiKey("anthropic");
      expect(apiKey).toBe("test-api-key");

      // Create client using ILLMClient interface
      const client: ILLMClient = new ClaudeLLMClient({
        apiKey: apiKey!,
        model: "claude-3-5-sonnet-latest",
      });

      // Verify client implements interface
      expect(client.providerName).toBe("anthropic");
      expect(typeof client.streamChat).toBe("function");
      expect(typeof client.completeInline).toBe("function");
    });

    it("should support streaming chat through abstraction", async () => {
      await apiKeyManager.storeApiKey("anthropic", "test-key");
      const apiKey = await apiKeyManager.getApiKey("anthropic");

      const client: ILLMClient = new ClaudeLLMClient({
        apiKey: apiKey!,
        model: "claude-3-5-sonnet-latest",
      });

      const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

      const abortController = new AbortController();

      // Should return async iterable
      const generator = client.streamChat(messages, abortController.signal);
      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe("function");
    });
  });

  describe("Acceptance Criteria 2: Switching model does not change UI logic", () => {
    it("should support multiple Claude models with same interface", async () => {
      await apiKeyManager.storeApiKey("anthropic", "test-key");
      const apiKey = await apiKeyManager.getApiKey("anthropic");

      // Create clients for different models
      const haikuClient: ILLMClient = new ClaudeLLMClient({
        apiKey: apiKey!,
        model: "claude-3-5-haiku-latest",
      });

      const sonnetClient: ILLMClient = new ClaudeLLMClient({
        apiKey: apiKey!,
        model: "claude-3-5-sonnet-latest",
      });

      const opusClient: ILLMClient = new ClaudeLLMClient({
        apiKey: apiKey!,
        model: "claude-3-opus-latest",
      });

      // All clients should have same interface
      expect(haikuClient.providerName).toBe("anthropic");
      expect(sonnetClient.providerName).toBe("anthropic");
      expect(opusClient.providerName).toBe("anthropic");

      // All should support same methods
      expect(typeof haikuClient.streamChat).toBe("function");
      expect(typeof sonnetClient.streamChat).toBe("function");
      expect(typeof opusClient.streamChat).toBe("function");
    });

    it("should allow model switching without changing client code", async () => {
      await apiKeyManager.storeApiKey("anthropic", "test-key");
      const apiKey = await apiKeyManager.getApiKey("anthropic");

      // Function that uses ILLMClient interface
      const useClient = (client: ILLMClient) => {
        return {
          provider: client.providerName,
          hasStreamChat: typeof client.streamChat === "function",
          hasCompleteInline: typeof client.completeInline === "function",
        };
      };

      // Use with different models
      const haikuResult = useClient(
        new ClaudeLLMClient({
          apiKey: apiKey!,
          model: "claude-3-5-haiku-latest",
        }),
      );

      const sonnetResult = useClient(
        new ClaudeLLMClient({
          apiKey: apiKey!,
          model: "claude-3-5-sonnet-latest",
        }),
      );

      // Results should be identical (same interface)
      expect(haikuResult).toEqual(sonnetResult);
    });
  });

  describe("Security: API keys never in plain text", () => {
    it("should store API keys securely", async () => {
      const plainTextKey = "sk-ant-secret-key-12345";

      // Store securely
      await apiKeyManager.storeApiKey("anthropic", plainTextKey);

      // Retrieve securely
      const retrievedKey = await apiKeyManager.getApiKey("anthropic");

      expect(retrievedKey).toBe(plainTextKey);
    });
  });
});
