/**
 * Retrieval types and interfaces
 *
 * Defines common types used across all retrieval methods.
 */

/**
 * Candidate item retrieved from codebase
 */
export interface RetrievalCandidate {
  /** File path relative to workspace root */
  filePath: string;

  /** Content of the code chunk */
  content: string;

  /** Relevance score (0-1) */
  score: number;

  /** Retrieval method that found this candidate */
  method: string;

  /** Line range in the file */
  lineRange?: {
    start: number;
    end: number;
  };

  /** Additional metadata */
  metadata?: {
    language?: string;
    symbolName?: string;
    symbolType?: string;
    lastModified?: Date;
    [key: string]: unknown;
  };
}

/**
 * Retrieval query parameters
 */
export interface RetrievalQuery {
  /** Query text */
  text: string;

  /** Maximum number of results */
  limit?: number;

  /** Minimum score threshold (0-1) */
  minScore?: number;

  /** File path filters (glob patterns) */
  filePatterns?: string[];

  /** Language filters */
  languages?: string[];
}

/**
 * Base interface for all retrievers
 */
export interface IRetriever {
  /**
   * Retrieve candidates based on query
   */
  retrieve(query: RetrievalQuery): Promise<RetrievalCandidate[]>;

  /**
   * Get retriever name
   */
  getName(): string;
}
