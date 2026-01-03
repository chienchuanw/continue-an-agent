/**
 * Recent Edits Retriever implementation
 *
 * Retrieves recently edited files and code chunks.
 * Particularly useful for bug fixing and understanding recent changes.
 */

import { IRetriever, RetrievalCandidate, RetrievalQuery } from "./types";
import { IMetadataStore } from "../indexer/MetadataStore";

/**
 * Recent Edits Retriever configuration
 */
export interface RecentEditsRetrieverConfig {
  /** Time window in milliseconds (default: 24 hours) */
  timeWindowMs: number;

  /** Default number of results */
  defaultLimit: number;

  /** Score decay factor based on time */
  timeDecayFactor: number;
}

/**
 * Recent Edits Retriever class
 *
 * Responsibilities:
 * - Query recently modified files from metadata store
 * - Apply time-based scoring (more recent = higher score)
 * - Filter by query relevance
 * - Return recent code chunks
 */
export class RecentEditsRetriever implements IRetriever {
  private metadataStore: IMetadataStore;
  private config: RecentEditsRetrieverConfig;

  constructor(
    metadataStore: IMetadataStore,
    config?: Partial<RecentEditsRetrieverConfig>,
  ) {
    this.metadataStore = metadataStore;
    this.config = {
      timeWindowMs: config?.timeWindowMs ?? 24 * 60 * 60 * 1000, // 24 hours
      defaultLimit: config?.defaultLimit ?? 10,
      timeDecayFactor: config?.timeDecayFactor ?? 0.5,
    };
  }

  /**
   * Get retriever name
   */
  getName(): string {
    return "recent_edits";
  }

  /**
   * Retrieve recently edited code chunks
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalCandidate[]> {
    // Step 1: Calculate time threshold
    const now = Date.now();
    const threshold = new Date(now - this.config.timeWindowMs);

    // Step 2: Query recently modified files
    const limit = query.limit ?? this.config.defaultLimit;
    const recentFiles = await this.metadataStore.getRecentlyModifiedFiles(
      threshold,
      limit * 2, // Get more than needed for filtering
    );

    // Step 3: Convert to candidates with time-based scoring
    const candidates: RetrievalCandidate[] = recentFiles.map((file) => {
      const timeSinceEdit = now - file.lastModified.getTime();
      const score = this.calculateTimeBasedScore(timeSinceEdit);

      return {
        filePath: file.filePath,
        content: file.content,
        score,
        method: this.getName(),
        lineRange: file.lineRange
          ? {
              start: file.lineRange.start,
              end: file.lineRange.end,
            }
          : undefined,
        metadata: {
          language: file.language,
          symbolName: file.symbolName,
          symbolType: file.symbolType,
          lastModified: file.lastModified,
          timeSinceEdit,
        },
      };
    });

    // Step 4: Apply query relevance filtering (simple keyword matching)
    const filteredCandidates = this.filterByRelevance(candidates, query.text);

    // Step 5: Apply additional filters
    let finalCandidates = filteredCandidates;
    if (query.filePatterns && query.filePatterns.length > 0) {
      finalCandidates = this.filterByFilePatterns(
        filteredCandidates,
        query.filePatterns,
      );
    }

    if (query.languages && query.languages.length > 0) {
      finalCandidates = this.filterByLanguages(
        finalCandidates,
        query.languages,
      );
    }

    // Step 6: Sort by score and limit
    return finalCandidates.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Calculate time-based score
   *
   * More recent edits get higher scores.
   * Uses exponential decay: score = e^(-decay * time)
   */
  private calculateTimeBasedScore(timeSinceEditMs: number): number {
    // Convert to hours
    const hours = timeSinceEditMs / (60 * 60 * 1000);

    // Exponential decay
    const score = Math.exp(-this.config.timeDecayFactor * hours);

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Filter candidates by query relevance
   *
   * Simple keyword matching for now.
   */
  private filterByRelevance(
    candidates: RetrievalCandidate[],
    queryText: string,
  ): RetrievalCandidate[] {
    const keywords = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    if (keywords.length === 0) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const content = candidate.content.toLowerCase();
      const filePath = candidate.filePath.toLowerCase();

      // Check if any keyword appears in content or file path
      return keywords.some(
        (keyword) => content.includes(keyword) || filePath.includes(keyword),
      );
    });
  }

  /**
   * Filter candidates by file patterns
   */
  private filterByFilePatterns(
    candidates: RetrievalCandidate[],
    patterns: string[],
  ): RetrievalCandidate[] {
    return candidates.filter((candidate) =>
      patterns.some((pattern) => candidate.filePath.includes(pattern)),
    );
  }

  /**
   * Filter candidates by programming languages
   */
  private filterByLanguages(
    candidates: RetrievalCandidate[],
    languages: string[],
  ): RetrievalCandidate[] {
    return candidates.filter(
      (candidate) =>
        candidate.metadata?.language &&
        languages.includes(candidate.metadata.language),
    );
  }
}
