import { describe, expect, test } from "vitest";
import type { ChatMessage, PromptLog } from "../index.js";
import { BaseLLM } from "./index.js";

// 建立一個測試用的 LLM 類別
class TestLLM extends BaseLLM {
  static providerName = "test";
  static defaultOptions = {};

  // 覆寫 templateMessages 避免使用 _streamComplete
  templateMessages = undefined;

  // 模擬 streamChat 的實作
  protected async *_streamChat(
    messages: ChatMessage[],
    signal: AbortSignal,
  ): AsyncGenerator<ChatMessage> {
    // 模擬串流回應
    yield {
      role: "assistant",
      content: "Hello",
    };

    yield {
      role: "assistant",
      content: " World",
    };

    // 最後一個 chunk 包含 usage 資訊
    yield {
      role: "assistant",
      content: "!",
      usage: {
        promptTokens: 500,
        completionTokens: 150,
        promptTokensDetails: {
          cachedTokens: 200,
        },
      },
    };
  }
}

describe("streamChat usage tracking", () => {
  test("should return PromptLog with usage information", async () => {
    // Arrange: 建立測試 LLM 實例
    const llm = new TestLLM({
      model: "test-model",
      apiKey: "test-key",
    });

    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

    const abortController = new AbortController();

    // Act: 執行 streamChat
    const generator = llm.streamChat(messages, abortController.signal, {
      model: "test-model",
    });

    // 消費所有 chunks
    const chunks: ChatMessage[] = [];
    let result = await generator.next();
    while (!result.done) {
      chunks.push(result.value);
      result = await generator.next();
    }

    const promptLog: PromptLog = result.value;

    // Assert: 驗證 PromptLog 包含 usage 資訊
    expect(promptLog).toBeDefined();
    expect(promptLog.modelTitle).toBe("test"); // BaseLLM 使用 providerName 作為 title
    expect(promptLog.modelProvider).toBe("test");
    expect(promptLog.completion).toContain("Hello");
    expect(promptLog.completion).toContain("World");

    // 重點：驗證 usage 欄位存在且正確
    expect(promptLog.usage).toBeDefined();
    expect(promptLog.usage?.promptTokens).toBe(500);
    expect(promptLog.usage?.completionTokens).toBe(150);
    expect(promptLog.usage?.promptTokensDetails?.cachedTokens).toBe(200);
  });

  test("should handle PromptLog without usage when LLM doesn't provide it", async () => {
    // Arrange: 建立一個不提供 usage 的 LLM
    class NoUsageLLM extends BaseLLM {
      static providerName = "no-usage";
      static defaultOptions = {};
      templateMessages = undefined;

      protected async *_streamChat(
        messages: ChatMessage[],
        signal: AbortSignal,
      ): AsyncGenerator<ChatMessage> {
        yield { role: "assistant", content: "Response without usage" };
      }
    }

    const llm = new NoUsageLLM({
      model: "no-usage-model",
      apiKey: "test-key",
    });

    const messages: ChatMessage[] = [{ role: "user", content: "Test" }];

    const abortController = new AbortController();

    // Act
    const generator = llm.streamChat(messages, abortController.signal, {
      model: "no-usage-model",
    });

    let result = await generator.next();
    while (!result.done) {
      result = await generator.next();
    }

    const promptLog: PromptLog = result.value;

    // Assert: usage 應該是 undefined
    expect(promptLog).toBeDefined();
    expect(promptLog.usage).toBeUndefined();
  });

  test("should use the last usage information when multiple chunks have usage", async () => {
    // Arrange: 建立一個提供多個 usage 的 LLM
    class MultiUsageLLM extends BaseLLM {
      static providerName = "multi-usage";
      static defaultOptions = {};
      templateMessages = undefined;

      protected async *_streamChat(
        messages: ChatMessage[],
        signal: AbortSignal,
      ): AsyncGenerator<ChatMessage> {
        yield {
          role: "assistant",
          content: "First",
          usage: { promptTokens: 100, completionTokens: 50 },
        };

        yield {
          role: "assistant",
          content: " Second",
          usage: { promptTokens: 200, completionTokens: 100 },
        };
      }
    }

    const llm = new MultiUsageLLM({
      model: "multi-usage-model",
      apiKey: "test-key",
    });

    const messages: ChatMessage[] = [{ role: "user", content: "Test" }];

    const abortController = new AbortController();

    // Act
    const generator = llm.streamChat(messages, abortController.signal, {
      model: "multi-usage-model",
    });

    let result = await generator.next();
    while (!result.done) {
      result = await generator.next();
    }

    const promptLog: PromptLog = result.value;

    // Assert: 應該使用最後一個 usage
    expect(promptLog.usage?.promptTokens).toBe(200);
    expect(promptLog.usage?.completionTokens).toBe(100);
  });
});
