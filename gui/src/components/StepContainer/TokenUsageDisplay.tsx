import type { Usage } from "core";

interface TokenUsageDisplayProps {
  usage?: Usage;
}

/**
 * 顯示簡潔版的 token 使用量
 * 格式：↑500 ↓150 (輸入/輸出 tokens)
 */
export default function TokenUsageDisplay({ usage }: TokenUsageDisplayProps) {
  // 如果沒有 usage 資訊，不渲染任何內容
  if (!usage) {
    return null;
  }

  // 格式化數字，加入千位分隔符
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className="text-description-muted flex items-center space-x-2 text-xs">
      {/* 輸入 tokens */}
      <span className="flex items-center space-x-0.5">
        <span className="text-red-400">↑</span>
        <span>{formatNumber(usage.promptTokens)}</span>
      </span>

      {/* 輸出 tokens */}
      <span className="flex items-center space-x-0.5">
        <span className="text-green-400">↓</span>
        <span>{formatNumber(usage.completionTokens)}</span>
      </span>

      {/* Cache tokens (如果有) */}
      {usage.promptTokensDetails?.cachedTokens !== undefined &&
        usage.promptTokensDetails.cachedTokens > 0 && (
          <span className="flex items-center space-x-0.5">
            <span className="text-orange-400">⚡</span>
            <span>{formatNumber(usage.promptTokensDetails.cachedTokens)}</span>
          </span>
        )}

      {/* Reasoning tokens (如果有) */}
      {usage.completionTokensDetails?.reasoningTokens !== undefined &&
        usage.completionTokensDetails.reasoningTokens > 0 && (
          <span className="flex items-center space-x-0.5">
            <span className="text-purple-400">🧠</span>
            <span>
              {formatNumber(usage.completionTokensDetails.reasoningTokens)}
            </span>
          </span>
        )}
    </div>
  );
}
