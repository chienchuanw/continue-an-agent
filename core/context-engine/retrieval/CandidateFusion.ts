/**
 * Candidate Fusion implementation
 *
 * Combines results from multiple retrieval methods using Reciprocal Rank Fusion (RRF).
 * Ensures diverse and high-quality candidates from different sources.
 */

import { RetrievalCandidate } from "./types";

/**
 * Fusion configuration
 */
export interface FusionConfig {
  /** RRF constant k (default: 60) */
  rrfK: number;

  /** Method weights for weighted fusion */
  methodWeights?: Map<string, number>;

  /** Whether to deduplicate candidates */
  deduplicate: boolean;

  /** Similarity threshold for deduplication (0-1) */
  deduplicationThreshold: number;
}

/**
 * Candidate Fusion class
 *
 * Responsibilities:
 * - Combine candidates from multiple retrievers
 * - Apply Reciprocal Rank Fusion (RRF)
 * - Deduplicate similar candidates
 * - Apply method weights
 */
export class CandidateFusion {
  private config: FusionConfig;

  constructor(config?: Partial<FusionConfig>) {
    this.config = {
      rrfK: config?.rrfK ?? 60,
      methodWeights: config?.methodWeights,
      deduplicate: config?.deduplicate ?? true,
      deduplicationThreshold: config?.deduplicationThreshold ?? 0.9,
    };
  }

  /**
   * Fuse candidates from multiple retrieval methods
   *
   * Uses Reciprocal Rank Fusion (RRF):
   * score = Σ (weight_i / (k + rank_i))
   */
  fuse(candidateLists: RetrievalCandidate[][]): RetrievalCandidate[] {
    // Step 1: Build candidate map with RRF scores
    const candidateMap = new Map<string, RetrievalCandidate>();
    const rrfScores = new Map<string, number>();

    for (const candidates of candidateLists) {
      if (candidates.length === 0) continue;

      // Get method name from first candidate
      const method = candidates[0].method;
      const weight = this.config.methodWeights?.get(method) ?? 1.0;

      // Calculate RRF score for each candidate
      candidates.forEach((candidate, rank) => {
        const key = this.getCandidateKey(candidate);
        const rrfScore = weight / (this.config.rrfK + rank + 1);

        // Accumulate RRF scores
        const currentScore = rrfScores.get(key) ?? 0;
        rrfScores.set(key, currentScore + rrfScore);

        // Store candidate (keep the one with highest original score)
        const existing = candidateMap.get(key);
        if (!existing || candidate.score > existing.score) {
          candidateMap.set(key, candidate);
        }
      });
    }

    // Step 2: Update candidates with fused scores
    const fusedCandidates: RetrievalCandidate[] = [];
    for (const [key, candidate] of candidateMap.entries()) {
      const fusedScore = rrfScores.get(key) ?? 0;
      fusedCandidates.push({
        ...candidate,
        score: this.normalizeRRFScore(fusedScore),
        metadata: {
          ...candidate.metadata,
          originalScore: candidate.score,
          rrfScore: fusedScore,
        },
      });
    }

    // Step 3: Deduplicate if enabled
    let finalCandidates = fusedCandidates;
    if (this.config.deduplicate) {
      finalCandidates = this.deduplicateCandidates(fusedCandidates);
    }

    // Step 4: Sort by fused score
    return finalCandidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Get unique key for candidate
   *
   * Uses file path and line range to identify unique candidates.
   */
  private getCandidateKey(candidate: RetrievalCandidate): string {
    const lineRange = candidate.lineRange
      ? `${candidate.lineRange.start}-${candidate.lineRange.end}`
      : "full";
    return `${candidate.filePath}:${lineRange}`;
  }

  /**
   * Normalize RRF score to 0-1 range
   *
   * Uses sigmoid-like normalization.
   */
  private normalizeRRFScore(rrfScore: number): number {
    // Simple normalization: score / (score + 1)
    return rrfScore / (rrfScore + 1);
  }

  /**
   * Deduplicate candidates based on content similarity
   *
   * Removes candidates that are too similar to higher-scored ones.
   */
  private deduplicateCandidates(
    candidates: RetrievalCandidate[],
  ): RetrievalCandidate[] {
    const deduplicated: RetrievalCandidate[] = [];
    const seen = new Set<string>();

    // Sort by score first
    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    for (const candidate of sorted) {
      // Check if similar to any already added candidate
      let isDuplicate = false;

      for (const existing of deduplicated) {
        const similarity = this.calculateSimilarity(candidate, existing);
        if (similarity >= this.config.deduplicationThreshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        deduplicated.push(candidate);
        seen.add(this.getCandidateKey(candidate));
      }
    }

    return deduplicated;
  }

  /**
   * Calculate similarity between two candidates
   *
   * Simple Jaccard similarity on content tokens.
   */
  private calculateSimilarity(
    a: RetrievalCandidate,
    b: RetrievalCandidate,
  ): number {
    // If same file and overlapping line ranges, consider very similar
    if (a.filePath === b.filePath && this.hasOverlappingLines(a, b)) {
      return 1.0;
    }

    // Otherwise, use token-based similarity
    const tokensA = new Set(this.tokenize(a.content));
    const tokensB = new Set(this.tokenize(b.content));

    const intersection = new Set(
      [...tokensA].filter((token) => tokensB.has(token)),
    );
    const union = new Set([...tokensA, ...tokensB]);

    return intersection.size / union.size;
  }

  /**
   * Check if two candidates have overlapping line ranges
   */
  private hasOverlappingLines(
    a: RetrievalCandidate,
    b: RetrievalCandidate,
  ): boolean {
    if (!a.lineRange || !b.lineRange) {
      return false;
    }

    return !(
      a.lineRange.end < b.lineRange.start || b.lineRange.end < a.lineRange.start
    );
  }

  /**
   * Tokenize content for similarity calculation
   */
  private tokenize(content: string): string[] {
    return content
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 2);
  }
}
