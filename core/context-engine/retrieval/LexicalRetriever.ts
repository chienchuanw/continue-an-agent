/**
 * Lexical Retriever implementation
 *
 * Uses SQLite FTS5 (Full-Text Search) for exact keyword matching.
 * Excellent for finding specific identifiers, function names, or error messages.
 */

import { IRetriever, RetrievalCandidate, RetrievalQuery } from "./types";
import { IMetadataStore } from "../indexer/MetadataStore";

/**
 * Lexical Retriever configuration
 */
export interface LexicalRetrieverConfig {
  /** Default number of results */
  defaultLimit: number;

  /** Minimum BM25 score threshold */
  minScore: number;

  /** Whether to use phrase matching */
  usePhraseMatching: boolean;
}

/**
 * Lexical Retriever class
 *
 * Responsibilities:
 * - Parse query into search terms
 * - Execute FTS5 search on metadata store
 * - Apply BM25 ranking
 * - Convert results to candidates
 */
export class LexicalRetriever implements IRetriever {
  private metadataStore: IMetadataStore;
  private config: LexicalRetrieverConfig;

  constructor(
    metadataStore: IMetadataStore,
    config?: Partial<LexicalRetrieverConfig>,
  ) {
    this.metadataStore = metadataStore;
    this.config = {
      defaultLimit: config?.defaultLimit ?? 10,
      minScore: config?.minScore ?? 0.1,
      usePhraseMatching: config?.usePhraseMatching ?? true,
    };
  }

  /**
   * Get retriever name
   */
  getName(): string {
    return "lexical";
  }

  /**
   * Retrieve code chunks using full-text search
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalCandidate[]> {
    // Step 1: Prepare search query
    const searchQuery = this.prepareSearchQuery(query.text);

    // Step 2: Execute FTS5 search
    const limit = query.limit ?? this.config.defaultLimit;
    const ftsResults = await this.metadataStore.fullTextSearch(
      searchQuery,
      limit,
    );

    // Step 3: Filter by minimum score
    const minScore = query.minScore ?? this.config.minScore;
    const filteredResults = ftsResults.filter(
      (result) => result.score >= minScore,
    );

    // Step 4: Convert to candidates
    const candidates: RetrievalCandidate[] = filteredResults.map((result) => ({
      filePath: result.filePath,
      content: result.content,
      score: this.normalizeScore(result.score),
      method: this.getName(),
      lineRange: result.lineRange
        ? {
            start: result.lineRange.start,
            end: result.lineRange.end,
          }
        : undefined,
      metadata: {
        language: result.language,
        symbolName: result.symbolName,
        symbolType: result.symbolType,
        lastModified: result.lastModified,
        rawScore: result.score,
        matchedTerms: result.matchedTerms,
      },
    }));

    // Step 5: Apply filters
    let finalCandidates = candidates;
    if (query.filePatterns && query.filePatterns.length > 0) {
      finalCandidates = this.filterByFilePatterns(
        candidates,
        query.filePatterns,
      );
    }

    if (query.languages && query.languages.length > 0) {
      finalCandidates = this.filterByLanguages(
        finalCandidates,
        query.languages,
      );
    }

    return finalCandidates;
  }

  /**
   * Prepare FTS5 search query
   *
   * Converts natural language query to FTS5 syntax.
   */
  private prepareSearchQuery(text: string): string {
    // Remove special characters that might break FTS5
    let cleanText = text.replace(/[^\w\s]/g, " ");

    // Split into terms
    const terms = cleanText
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => term.toLowerCase());

    if (terms.length === 0) {
      return "";
    }

    // Use phrase matching if enabled and query has multiple terms
    if (this.config.usePhraseMatching && terms.length > 1) {
      // Try exact phrase first, then individual terms
      return `"${terms.join(" ")}" OR ${terms.join(" OR ")}`;
    }

    // Otherwise, use OR for individual terms
    return terms.join(" OR ");
  }

  /**
   * Normalize BM25 score to 0-1 range
   *
   * BM25 scores are unbounded, so we use a sigmoid-like normalization.
   */
  private normalizeScore(rawScore: number): number {
    // Simple normalization: score / (score + k)
    // where k controls the steepness
    const k = 10;
    return rawScore / (rawScore + k);
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
