/**
 * Truncation Strategy implementation
 *
 * Defines strategies for truncating content when exceeding token budget.
 * Ensures graceful degradation while preserving important information.
 */

import { RetrievalCandidate } from "../retrieval/types";
import { TokenCounter } from "./TokenCounter";

/**
 * Truncation mode
 */
export enum TruncationMode {
  /** Keep highest-scored items, drop rest */
  DROP_LOWEST = "drop_lowest",

  /** Truncate each item proportionally */
  PROPORTIONAL = "proportional",

  /** Keep first N items fully, drop rest */
  KEEP_FIRST = "keep_first",

  /** Smart truncation based on content type */
  SMART = "smart",
}

/**
 * Truncation result
 */
export interface TruncationResult {
  /** Truncated candidates */
  candidates: RetrievalCandidate[];

  /** Total tokens after truncation */
  totalTokens: number;

  /** Number of candidates dropped */
  droppedCount: number;

  /** Number of candidates truncated */
  truncatedCount: number;

  /** Truncation mode used */
  mode: TruncationMode;
}

/**
 * Truncation Strategy class
 *
 * Responsibilities:
 * - Apply different truncation strategies
 * - Preserve important information
 * - Track what was truncated
 * - Provide truncation metadata
 */
export class TruncationStrategy {
  private tokenCounter: TokenCounter;

  constructor(tokenCounter: TokenCounter) {
    this.tokenCounter = tokenCounter;
  }

  /**
   * Truncate candidates to fit within token budget
   */
  truncate(
    candidates: RetrievalCandidate[],
    tokenBudget: number,
    mode: TruncationMode = TruncationMode.DROP_LOWEST,
  ): TruncationResult {
    switch (mode) {
      case TruncationMode.DROP_LOWEST:
        return this.truncateDropLowest(candidates, tokenBudget);

      case TruncationMode.PROPORTIONAL:
        return this.truncateProportional(candidates, tokenBudget);

      case TruncationMode.KEEP_FIRST:
        return this.truncateKeepFirst(candidates, tokenBudget);

      case TruncationMode.SMART:
        return this.truncateSmart(candidates, tokenBudget);

      default:
        return this.truncateDropLowest(candidates, tokenBudget);
    }
  }

  /**
   * Drop lowest-scored candidates until within budget
   */
  private truncateDropLowest(
    candidates: RetrievalCandidate[],
    tokenBudget: number,
  ): TruncationResult {
    // Sort by score (highest first)
    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    const kept: RetrievalCandidate[] = [];
    let totalTokens = 0;

    for (const candidate of sorted) {
      const tokens = this.tokenCounter.countTokens(candidate.content);

      if (totalTokens + tokens <= tokenBudget) {
        kept.push(candidate);
        totalTokens += tokens;
      } else {
        // Budget exhausted
        break;
      }
    }

    return {
      candidates: kept,
      totalTokens,
      droppedCount: candidates.length - kept.length,
      truncatedCount: 0,
      mode: TruncationMode.DROP_LOWEST,
    };
  }

  /**
   * Truncate each candidate proportionally
   */
  private truncateProportional(
    candidates: RetrievalCandidate[],
    tokenBudget: number,
  ): TruncationResult {
    if (candidates.length === 0) {
      return {
        candidates: [],
        totalTokens: 0,
        droppedCount: 0,
        truncatedCount: 0,
        mode: TruncationMode.PROPORTIONAL,
      };
    }

    // Calculate total tokens needed
    const totalTokensNeeded = candidates.reduce(
      (sum, c) => sum + this.tokenCounter.countTokens(c.content),
      0,
    );

    if (totalTokensNeeded <= tokenBudget) {
      // No truncation needed
      return {
        candidates,
        totalTokens: totalTokensNeeded,
        droppedCount: 0,
        truncatedCount: 0,
        mode: TruncationMode.PROPORTIONAL,
      };
    }

    // Calculate truncation ratio
    const ratio = tokenBudget / totalTokensNeeded;

    // Truncate each candidate proportionally
    const truncated = candidates.map((candidate) => {
      const originalTokens = this.tokenCounter.countTokens(candidate.content);
      const targetTokens = Math.floor(originalTokens * ratio);
      const targetChars = targetTokens * 4; // ~4 chars per token

      if (candidate.content.length <= targetChars) {
        return candidate;
      }

      return {
        ...candidate,
        content:
          candidate.content.substring(0, targetChars) +
          "\n\n[... truncated ...]",
        metadata: {
          ...candidate.metadata,
          wasTruncated: true,
          originalLength: candidate.content.length,
        },
      };
    });

    const totalTokens = truncated.reduce(
      (sum, c) => sum + this.tokenCounter.countTokens(c.content),
      0,
    );

    return {
      candidates: truncated,
      totalTokens,
      droppedCount: 0,
      truncatedCount: truncated.filter((c) => c.metadata?.wasTruncated).length,
      mode: TruncationMode.PROPORTIONAL,
    };
  }

  /**
   * Keep first N candidates fully, drop rest
   */
  private truncateKeepFirst(
    candidates: RetrievalCandidate[],
    tokenBudget: number,
  ): TruncationResult {
    const kept: RetrievalCandidate[] = [];
    let totalTokens = 0;

    for (const candidate of candidates) {
      const tokens = this.tokenCounter.countTokens(candidate.content);

      if (totalTokens + tokens <= tokenBudget) {
        kept.push(candidate);
        totalTokens += tokens;
      } else {
        break;
      }
    }

    return {
      candidates: kept,
      totalTokens,
      droppedCount: candidates.length - kept.length,
      truncatedCount: 0,
      mode: TruncationMode.KEEP_FIRST,
    };
  }

  /**
   * Smart truncation based on content type and importance
   */
  private truncateSmart(
    candidates: RetrievalCandidate[],
    tokenBudget: number,
  ): TruncationResult {
    // For now, use DROP_LOWEST as smart strategy
    // TODO: Implement smarter logic based on:
    // - Content type (code vs docs)
    // - Symbol importance (class vs variable)
    // - File type (test vs implementation)
    return this.truncateDropLowest(candidates, tokenBudget);
  }
}
