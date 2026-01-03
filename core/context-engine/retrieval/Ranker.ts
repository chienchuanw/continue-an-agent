/**
 * Ranker implementation
 *
 * Applies final ranking and scoring to fused candidates.
 * Combines multiple signals to produce the final relevance score.
 */

import { RetrievalCandidate } from "./types";
import { IntentType } from "../types";

/**
 * Ranking configuration
 */
export interface RankerConfig {
  /** Weight for semantic similarity */
  semanticWeight: number;

  /** Weight for recency */
  recencyWeight: number;

  /** Weight for file type relevance */
  fileTypeWeight: number;

  /** Weight for symbol type relevance */
  symbolTypeWeight: number;

  /** Whether to apply diversity penalty */
  applyDiversityPenalty: boolean;
}

/**
 * Ranker class
 *
 * Responsibilities:
 * - Apply intent-specific ranking
 * - Combine multiple scoring signals
 * - Apply diversity penalty
 * - Produce final ranked list
 */
export class Ranker {
  private config: RankerConfig;

  constructor(config?: Partial<RankerConfig>) {
    this.config = {
      semanticWeight: config?.semanticWeight ?? 0.5,
      recencyWeight: config?.recencyWeight ?? 0.2,
      fileTypeWeight: config?.fileTypeWeight ?? 0.15,
      symbolTypeWeight: config?.symbolTypeWeight ?? 0.15,
      applyDiversityPenalty: config?.applyDiversityPenalty ?? true,
    };
  }

  /**
   * Rank candidates with intent-aware scoring
   */
  rank(
    candidates: RetrievalCandidate[],
    intent: IntentType,
    query: string,
  ): RetrievalCandidate[] {
    // Step 1: Calculate final scores
    const scoredCandidates = candidates.map((candidate) => ({
      ...candidate,
      score: this.calculateFinalScore(candidate, intent, query),
    }));

    // Step 2: Apply diversity penalty if enabled
    let finalCandidates = scoredCandidates;
    if (this.config.applyDiversityPenalty) {
      finalCandidates = this.applyDiversityPenalty(scoredCandidates);
    }

    // Step 3: Sort by final score
    return finalCandidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate final score combining multiple signals
   */
  private calculateFinalScore(
    candidate: RetrievalCandidate,
    intent: IntentType,
    query: string,
  ): number {
    // Base score from retrieval method
    let score = candidate.score * this.config.semanticWeight;

    // Add recency signal
    const recencyScore = this.calculateRecencyScore(candidate);
    score += recencyScore * this.config.recencyWeight;

    // Add file type relevance
    const fileTypeScore = this.calculateFileTypeScore(candidate, intent);
    score += fileTypeScore * this.config.fileTypeWeight;

    // Add symbol type relevance
    const symbolTypeScore = this.calculateSymbolTypeScore(candidate, intent);
    score += symbolTypeScore * this.config.symbolTypeWeight;

    // Normalize to [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate recency score
   *
   * More recently modified files get higher scores.
   */
  private calculateRecencyScore(candidate: RetrievalCandidate): number {
    if (!candidate.metadata?.lastModified) {
      return 0.5; // Neutral score if no timestamp
    }

    const now = Date.now();
    const lastModified = candidate.metadata.lastModified.getTime();
    const ageMs = now - lastModified;

    // Convert to hours
    const ageHours = ageMs / (60 * 60 * 1000);

    // Exponential decay: score = e^(-0.1 * hours)
    // Recent files (< 1 hour) get ~0.9, files from 24h ago get ~0.1
    return Math.exp(-0.1 * ageHours);
  }

  /**
   * Calculate file type relevance score
   *
   * Different intents prefer different file types.
   */
  private calculateFileTypeScore(
    candidate: RetrievalCandidate,
    intent: IntentType,
  ): number {
    const filePath = candidate.filePath.toLowerCase();

    switch (intent) {
      case IntentType.TEST:
        // Prefer test files
        if (
          filePath.includes(".test.") ||
          filePath.includes(".spec.") ||
          filePath.includes("__tests__")
        ) {
          return 1.0;
        }
        return 0.3;

      case IntentType.BUG_FIX:
        // Prefer implementation files over tests
        if (
          filePath.includes(".test.") ||
          filePath.includes(".spec.") ||
          filePath.includes("__tests__")
        ) {
          return 0.3;
        }
        return 1.0;

      case IntentType.REFACTOR:
        // Prefer implementation files
        if (
          filePath.includes(".test.") ||
          filePath.includes(".spec.") ||
          filePath.includes("__tests__")
        ) {
          return 0.2;
        }
        return 1.0;

      default:
        return 0.5; // Neutral
    }
  }

  /**
   * Calculate symbol type relevance score
   *
   * Different intents prefer different symbol types.
   */
  private calculateSymbolTypeScore(
    candidate: RetrievalCandidate,
    intent: IntentType,
  ): number {
    const symbolType = candidate.metadata?.symbolType?.toLowerCase();

    if (!symbolType) {
      return 0.5; // Neutral if no symbol type
    }

    switch (intent) {
      case IntentType.REFACTOR:
        // Prefer classes and functions
        if (symbolType === "class" || symbolType === "function") {
          return 1.0;
        }
        return 0.5;

      case IntentType.GENERATE:
        // Prefer functions and methods as examples
        if (symbolType === "function" || symbolType === "method") {
          return 1.0;
        }
        return 0.5;

      default:
        return 0.5; // Neutral
    }
  }

  /**
   * Apply diversity penalty
   *
   * Penalize candidates from the same file to encourage diversity.
   */
  private applyDiversityPenalty(
    candidates: RetrievalCandidate[],
  ): RetrievalCandidate[] {
    const fileCount = new Map<string, number>();
    const penalizedCandidates: RetrievalCandidate[] = [];

    for (const candidate of candidates) {
      const count = fileCount.get(candidate.filePath) ?? 0;
      fileCount.set(candidate.filePath, count + 1);

      // Apply penalty: score * (1 / (1 + count))
      const penalty = 1 / (1 + count);
      penalizedCandidates.push({
        ...candidate,
        score: candidate.score * penalty,
        metadata: {
          ...candidate.metadata,
          diversityPenalty: penalty,
        },
      });
    }

    return penalizedCandidates;
  }
}
