/**
 * Prompt Packer implementation
 *
 * Packs retrieval candidates into prompt sections within token budget.
 * Ensures optimal use of available tokens while maintaining quality.
 */

import { RetrievalCandidate } from "../retrieval/types";
import { TokenCounter } from "./TokenCounter";
import { ContextItem } from "../../index.d";

/**
 * Packing result
 */
export interface PackingResult {
  /** Packed context items */
  items: ContextItem[];

  /** Total tokens used */
  tokensUsed: number;

  /** Number of candidates packed */
  packedCount: number;

  /** Number of candidates truncated */
  truncatedCount: number;

  /** Truncation applied */
  wasTruncated: boolean;
}

/**
 * Prompt Packer configuration
 */
export interface PromptPackerConfig {
  /** Whether to include file paths in context */
  includeFilePaths: boolean;

  /** Whether to include line numbers */
  includeLineNumbers: boolean;

  /** Separator between context items */
  itemSeparator: string;

  /** Maximum tokens per item */
  maxTokensPerItem: number;
}

/**
 * Prompt Packer class
 *
 * Responsibilities:
 * - Pack candidates into context items
 * - Respect token budget
 * - Apply truncation when needed
 * - Format context items
 */
export class PromptPacker {
  private tokenCounter: TokenCounter;
  private config: PromptPackerConfig;

  constructor(
    tokenCounter: TokenCounter,
    config?: Partial<PromptPackerConfig>,
  ) {
    this.tokenCounter = tokenCounter;
    this.config = {
      includeFilePaths: config?.includeFilePaths ?? true,
      includeLineNumbers: config?.includeLineNumbers ?? true,
      itemSeparator: config?.itemSeparator ?? "\n\n---\n\n",
      maxTokensPerItem: config?.maxTokensPerItem ?? 1000,
    };
  }

  /**
   * Pack candidates into context items within budget
   */
  pack(candidates: RetrievalCandidate[], tokenBudget: number): PackingResult {
    const items: ContextItem[] = [];
    let tokensUsed = 0;
    let packedCount = 0;
    let truncatedCount = 0;

    // Sort candidates by score (highest first)
    const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);

    for (const candidate of sortedCandidates) {
      // Format candidate as context item
      const contextItem = this.formatContextItem(candidate);

      // Count tokens in this item
      const itemTokens = this.countItemTokens(contextItem);

      // Check if we have budget for this item
      if (tokensUsed + itemTokens <= tokenBudget) {
        // Add full item
        items.push(contextItem);
        tokensUsed += itemTokens;
        packedCount++;
      } else {
        // Try to fit a truncated version
        const remainingBudget = tokenBudget - tokensUsed;
        if (remainingBudget > 100) {
          // Only truncate if we have reasonable space
          const truncatedItem = this.truncateItem(contextItem, remainingBudget);
          if (truncatedItem) {
            items.push(truncatedItem);
            tokensUsed += this.countItemTokens(truncatedItem);
            packedCount++;
            truncatedCount++;
          }
        }
        // Stop packing - budget exhausted
        break;
      }
    }

    return {
      items,
      tokensUsed,
      packedCount,
      truncatedCount,
      wasTruncated: truncatedCount > 0 || packedCount < candidates.length,
    };
  }

  /**
   * Format retrieval candidate as context item
   */
  private formatContextItem(candidate: RetrievalCandidate): ContextItem {
    let content = candidate.content;

    // Add file path if enabled
    if (this.config.includeFilePaths) {
      const header = `File: ${candidate.filePath}`;
      content = `${header}\n\n${content}`;
    }

    // Add line numbers if enabled and available
    if (this.config.includeLineNumbers && candidate.lineRange) {
      const lineInfo = `Lines ${candidate.lineRange.start}-${candidate.lineRange.end}`;
      content = `${lineInfo}\n${content}`;
    }

    return {
      name: candidate.filePath,
      description: `Score: ${candidate.score.toFixed(3)} | Method: ${candidate.method}`,
      content,
    };
  }

  /**
   * Count tokens in a context item
   */
  private countItemTokens(item: ContextItem): number {
    // Count tokens in all parts
    const nameTokens = this.tokenCounter.countTokens(item.name);
    const descTokens = item.description
      ? this.tokenCounter.countTokens(item.description)
      : 0;
    const contentTokens = this.tokenCounter.countTokens(item.content);
    const separatorTokens = this.tokenCounter.countTokens(
      this.config.itemSeparator,
    );

    return nameTokens + descTokens + contentTokens + separatorTokens;
  }

  /**
   * Truncate item to fit within token budget
   */
  private truncateItem(
    item: ContextItem,
    tokenBudget: number,
  ): ContextItem | null {
    // Calculate overhead (name + description + separator)
    const overhead =
      this.tokenCounter.countTokens(item.name) +
      (item.description ? this.tokenCounter.countTokens(item.description) : 0) +
      this.tokenCounter.countTokens(this.config.itemSeparator);

    const contentBudget = tokenBudget - overhead;

    if (contentBudget <= 50) {
      // Not enough space for meaningful content
      return null;
    }

    // Truncate content to fit budget
    const truncatedContent = this.truncateContent(item.content, contentBudget);

    return {
      ...item,
      content: truncatedContent + "\n\n[... truncated ...]",
    };
  }

  /**
   * Truncate content to fit within token budget
   */
  private truncateContent(content: string, tokenBudget: number): string {
    // Estimate characters from token budget
    const estimatedChars = tokenBudget * 4; // ~4 chars per token

    if (content.length <= estimatedChars) {
      return content;
    }

    // Truncate at character boundary
    return content.substring(0, estimatedChars);
  }
}
