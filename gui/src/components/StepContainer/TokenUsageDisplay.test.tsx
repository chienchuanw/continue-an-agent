import { render, screen } from "@testing-library/react";
import type { Usage } from "core";
import { describe, expect, test } from "vitest";
import TokenUsageDisplay from "./TokenUsageDisplay";

describe("TokenUsageDisplay", () => {
  test("should display token usage in compact format when usage is provided", () => {
    // Arrange
    const usage: Usage = {
      promptTokens: 500,
      completionTokens: 150,
    };

    // Act
    render(<TokenUsageDisplay usage={usage} />);

    // Assert: 應該顯示 ↑500 ↓150 格式
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  test("should not render anything when usage is undefined", () => {
    // Arrange & Act
    const { container } = render(<TokenUsageDisplay usage={undefined} />);

    // Assert: 不應該渲染任何內容
    expect(container.firstChild).toBeNull();
  });

  test("should display cache tokens when available", () => {
    // Arrange
    const usage: Usage = {
      promptTokens: 500,
      completionTokens: 150,
      promptTokensDetails: {
        cachedTokens: 200,
      },
    };

    // Act
    render(<TokenUsageDisplay usage={usage} />);

    // Assert: 應該顯示 cache 資訊
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  test("should display reasoning tokens when available", () => {
    // Arrange
    const usage: Usage = {
      promptTokens: 500,
      completionTokens: 150,
      completionTokensDetails: {
        reasoningTokens: 50,
      },
    };

    // Act
    render(<TokenUsageDisplay usage={usage} />);

    // Assert: 應該顯示 reasoning tokens (使用 emoji 來確認)
    expect(screen.getByText(/🧠/)).toBeInTheDocument();
    const allFifties = screen.getAllByText(/50/);
    expect(allFifties.length).toBeGreaterThan(0);
  });

  test("should format large numbers with commas", () => {
    // Arrange
    const usage: Usage = {
      promptTokens: 1500,
      completionTokens: 2500,
    };

    // Act
    render(<TokenUsageDisplay usage={usage} />);

    // Assert: 大數字應該有千位分隔符
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  test("should handle zero tokens", () => {
    // Arrange
    const usage: Usage = {
      promptTokens: 0,
      completionTokens: 0,
    };

    // Act
    render(<TokenUsageDisplay usage={usage} />);

    // Assert: 應該顯示 0
    const zeros = screen.getAllByText(/0/);
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});
