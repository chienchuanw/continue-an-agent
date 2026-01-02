/**
 * Tests for ILLMClient interface implementations
 *
 * These tests verify that LLM providers correctly implement the ILLMClient interface.
 * Following TDD principles, we define expected behavior before implementation.
 */

import { ChatMessage } from "../index.js";
import { ILLMClient, LLMContext } from "./ILLMClient.interface.js";

/**
 * Mock LLM Client for testing
 */
class MockLLMClient implements ILLMClient {
  readonly providerName = "mock";

  async *streamChat(
    messages: ChatMessage[],
    signal: AbortSignal,
    context?: LLMContext,
  ): AsyncIterable<ChatMessage> {
    // Simulate streaming response
    const response = "This is a test response";
    for (const char of response) {
      if (signal.aborted) {
        throw new Error("Aborted");
      }
      yield {
        role: "assistant",
        content: char,
      };
    }
  }

  async *completeInline(
    prefix: string,
    suffix: string,
    signal: AbortSignal,
    context?: LLMContext,
  ): AsyncIterable<string> {
    // Simulate inline completion
    const completion = "const result = ";
    for (const char of completion) {
      if (signal.aborted) {
        throw new Error("Aborted");
      }
      yield char;
    }
  }
}

describe("ILLMClient Interface", () => {
  let client: ILLMClient;
  let abortController: AbortController;

  beforeEach(() => {
    client = new MockLLMClient();
    abortController = new AbortController();
  });

  describe("streamChat", () => {
    it("should stream chat messages", async () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

      const chunks: ChatMessage[] = [];
      for await (const chunk of client.streamChat(
        messages,
        abortController.signal,
      )) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].role).toBe("assistant");
    });

    it("should respect abort signal", async () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

      // Abort immediately
      abortController.abort();

      await expect(async () => {
        for await (const chunk of client.streamChat(
          messages,
          abortController.signal,
        )) {
          // Should not reach here
        }
      }).rejects.toThrow("Aborted");
    });

    it("should accept context parameter", async () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

      const context: LLMContext = {
        tokenBudget: 1000,
        metadata: { intent: "explain" },
      };

      const chunks: ChatMessage[] = [];
      for await (const chunk of client.streamChat(
        messages,
        abortController.signal,
        context,
      )) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe("completeInline", () => {
    it("should stream inline completions", async () => {
      const prefix = "function add(a, b) {\n  ";
      const suffix = "\n}";

      const chunks: string[] = [];
      for await (const chunk of client.completeInline(
        prefix,
        suffix,
        abortController.signal,
      )) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(typeof chunks[0]).toBe("string");
    });

    it("should respect abort signal", async () => {
      const prefix = "const x = ";
      const suffix = ";";

      // Abort immediately
      abortController.abort();

      await expect(async () => {
        for await (const chunk of client.completeInline(
          prefix,
          suffix,
          abortController.signal,
        )) {
          // Should not reach here
        }
      }).rejects.toThrow("Aborted");
    });

    it("should accept context parameter", async () => {
      const prefix = "const x = ";
      const suffix = ";";

      const context: LLMContext = {
        tokenBudget: 100,
      };

      const chunks: string[] = [];
      for await (const chunk of client.completeInline(
        prefix,
        suffix,
        abortController.signal,
        context,
      )) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
