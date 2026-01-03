/**
 * Semantic Retriever implementation
 *
 * Uses vector similarity search to find semantically related code chunks.
 * Primary retrieval method for understanding-based queries.
 */

import { IRetriever, RetrievalCandidate, RetrievalQuery } from "./types";
import { ILanceDbVectorStore } from "../embeddings/LanceDbVectorStore";
import { ILocalEmbeddingProvider } from "../embeddings/LocalEmbeddingProvider";

/**
 * Semantic Retriever configuration
 */
export interface SemanticRetrieverConfig {
  /** Default number of results */
  defaultLimit: number;

  /** Minimum similarity score threshold (0-1) */
  minSimilarity: number;

  /** Whether to use reranking */
  useReranking: boolean;
}

/**
 * Semantic Retriever class
 *
 * Responsibilities:
 * - Generate query embedding
 * - Search vector store for similar chunks
 * - Convert vector results to candidates
 * - Apply score normalization
 */
export class SemanticRetriever implements IRetriever {
  private vectorStore: ILanceDbVectorStore;
  private embeddingProvider: ILocalEmbeddingProvider;
  private config: SemanticRetrieverConfig;

  constructor(
    vectorStore: ILanceDbVectorStore,
    embeddingProvider: ILocalEmbeddingProvider,
    config?: Partial<SemanticRetrieverConfig>,
  ) {
    this.vectorStore = vectorStore;
    this.embeddingProvider = embeddingProvider;
    this.config = {
      defaultLimit: config?.defaultLimit ?? 10,
      minSimilarity: config?.minSimilarity ?? 0.5,
      useReranking: config?.useReranking ?? false,
    };
  }

  /**
   * Get retriever name
   */
  getName(): string {
    return "semantic";
  }

  /**
   * Retrieve semantically similar code chunks
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalCandidate[]> {
    // Step 1: Generate query embedding
    const queryEmbedding = await this.embeddingProvider.generateEmbedding(
      query.text,
    );

    // Step 2: Search vector store
    const limit = query.limit ?? this.config.defaultLimit;
    const vectorResults = await this.vectorStore.search(queryEmbedding, limit);

    // Step 3: Filter by minimum score
    const minScore = query.minScore ?? this.config.minSimilarity;
    const filteredResults = vectorResults.filter(
      (result) => result.score >= minScore,
    );

    // Step 4: Convert to candidates
    const candidates: RetrievalCandidate[] = filteredResults.map((result) => ({
      filePath: result.metadata.filePath,
      content: result.content,
      score: this.normalizeScore(result.score),
      method: this.getName(),
      lineRange: result.metadata.lineRange
        ? {
            start: result.metadata.lineRange.start,
            end: result.metadata.lineRange.end,
          }
        : undefined,
      metadata: {
        language: result.metadata.language,
        symbolName: result.metadata.symbolName,
        symbolType: result.metadata.symbolType,
        lastModified: result.metadata.lastModified,
        rawScore: result.score,
      },
    }));

    // Step 5: Apply file pattern filters if specified
    let finalCandidates = candidates;
    if (query.filePatterns && query.filePatterns.length > 0) {
      finalCandidates = this.filterByFilePatterns(
        candidates,
        query.filePatterns,
      );
    }

    // Step 6: Apply language filters if specified
    if (query.languages && query.languages.length > 0) {
      finalCandidates = this.filterByLanguages(
        finalCandidates,
        query.languages,
      );
    }

    return finalCandidates;
  }

  /**
   * Normalize similarity score to 0-1 range
   *
   * Vector similarity scores can vary by distance metric.
   * This normalizes them to a consistent 0-1 range.
   */
  private normalizeScore(rawScore: number): number {
    // Cosine similarity is already in [-1, 1], map to [0, 1]
    // Assuming rawScore is cosine similarity
    return (rawScore + 1) / 2;
  }

  /**
   * Filter candidates by file patterns
   */
  private filterByFilePatterns(
    candidates: RetrievalCandidate[],
    patterns: string[],
  ): RetrievalCandidate[] {
    // Simple pattern matching (can be enhanced with glob library)
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
