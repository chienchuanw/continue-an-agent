import { describe, expect, test } from "vitest";
import type { PromptLog, Usage } from "../index.js";

describe("PromptLog type", () => {
  test("should allow PromptLog with usage field", () => {
    // 測試：PromptLog 應該可以包含 usage 欄位
    const usage: Usage = {
      promptTokens: 500,
      completionTokens: 150,
      promptTokensDetails: {
        cachedTokens: 200,
        cacheWriteTokens: 100,
      },
      completionTokensDetails: {
        reasoningTokens: 50,
      },
    };

    const promptLogWithUsage: PromptLog = {
      modelTitle: "Claude 3.5 Sonnet",
      modelProvider: "anthropic",
      prompt: "Test prompt",
      completion: "Test completion",
      usage: usage,
    };

    // 驗證所有欄位都存在
    expect(promptLogWithUsage.modelTitle).toBe("Claude 3.5 Sonnet");
    expect(promptLogWithUsage.modelProvider).toBe("anthropic");
    expect(promptLogWithUsage.prompt).toBe("Test prompt");
    expect(promptLogWithUsage.completion).toBe("Test completion");
    expect(promptLogWithUsage.usage).toBeDefined();
    expect(promptLogWithUsage.usage?.promptTokens).toBe(500);
    expect(promptLogWithUsage.usage?.completionTokens).toBe(150);
  });

  test("should allow PromptLog without usage field", () => {
    // 測試：usage 欄位應該是可選的
    const promptLogWithoutUsage: PromptLog = {
      modelTitle: "GPT-4",
      modelProvider: "openai",
      prompt: "Test prompt",
      completion: "Test completion",
    };

    expect(promptLogWithoutUsage.usage).toBeUndefined();
  });

  test("should allow partial usage information", () => {
    // 測試：usage 可以只包含部分資訊
    const partialUsage: Usage = {
      promptTokens: 300,
      completionTokens: 100,
    };

    const promptLog: PromptLog = {
      modelTitle: "Test Model",
      modelProvider: "test",
      prompt: "Test",
      completion: "Test",
      usage: partialUsage,
    };

    expect(promptLog.usage?.promptTokens).toBe(300);
    expect(promptLog.usage?.completionTokens).toBe(100);
    expect(promptLog.usage?.promptTokensDetails).toBeUndefined();
  });
});
