/**
 * Main Context Engine implementation
 *
 * The Context Engine is responsible for:
 * - Intent classification
 * - Multi-method retrieval
 * - Ranking and scoring
 * - Token budget optimization
 */

import {
  BudgetAllocator,
  PromptPacker,
  TokenCounter,
  TruncationStrategy,
} from "./budget";
import { IntentClassifier } from "./intent/IntentClassifier";
import { RetrievalStrategySelector } from "./intent/RetrievalStrategySelector";
import {
  CandidateFusion,
  IRetriever,
  Ranker,
  RetrievalQuery,
} from "./retrieval";
import {
  ContextEngineConfig,
  ContextQuery,
  ContextResult,
  IContextEngine,
} from "./types";

/**
 * Context Engine implementation
 *
 * This is the main entry point for context retrieval.
 * It orchestrates the entire pipeline from intent classification
 * to final context assembly.
 */
export class ContextEngine implements IContextEngine {
  private initialized: boolean = false;
  private config: ContextEngineConfig;
  private intentClassifier: IntentClassifier;
  private strategySelector: RetrievalStrategySelector;
  private retrievers: Map<string, IRetriever>;
  private fusion: CandidateFusion;
  private ranker: Ranker;
  private tokenCounter: TokenCounter;
  private budgetAllocator: BudgetAllocator;
  private promptPacker: PromptPacker;
  private truncationStrategy: TruncationStrategy;

  constructor(config: ContextEngineConfig) {
    this.config = config;
    this.intentClassifier = new IntentClassifier();
    this.strategySelector = new RetrievalStrategySelector();
    this.retrievers = new Map();
    this.fusion = new CandidateFusion();
    this.ranker = new Ranker();
    this.tokenCounter = new TokenCounter();
    this.budgetAllocator = new BudgetAllocator();
    this.promptPacker = new PromptPacker(this.tokenCounter);
    this.truncationStrategy = new TruncationStrategy(this.tokenCounter);
  }

  /**
   * Register a retriever
   *
   * Allows external code to register retrieval methods.
   */
  registerRetriever(retriever: IRetriever): void {
    this.retrievers.set(retriever.getName(), retriever);
  }

  /**
   * Initialize the Context Engine
   *
   * Sets up all necessary components including:
   * - Indexer
   * - Retrievers
   * - Ranker
   * - Budget allocator
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // TODO: Initialize components in Phase 1
    // - File watcher
    // - Incremental indexer
    // - LanceDB vector store
    // - Embedding provider
    // - Metadata store

    // TODO: Register retrievers in Phase 3
    // - SemanticRetriever
    // - LexicalRetriever
    // - DependencyWalker
    // - RecentEditsRetriever

    this.initialized = true;
  }

  /**
   * Query the Context Engine for relevant context
   *
   * Pipeline:
   * 1. Validate input
   * 2. Classify intent (if not provided)
   * 3. Select retrieval strategy
   * 4. Retrieve candidates
   * 5. Rank and score
   * 6. Apply token budget
   * 7. Pack into context items
   */
  async query(query: ContextQuery): Promise<ContextResult> {
    // Validate initialization
    if (!this.initialized) {
      throw new Error("ContextEngine must be initialized before querying");
    }

    // Validate token budget
    if (query.tokenBudget <= 0) {
      throw new Error("Token budget must be positive");
    }

    // Step 1: Classify intent if not provided
    const intentResult = query.intent
      ? { intent: query.intent, confidence: 1.0 }
      : this.intentClassifier.classify(query.input);

    const intent = intentResult.intent;

    // Step 2: Select retrieval strategy based on intent
    const strategy = this.strategySelector.selectStrategy(intent);

    // Step 3: Retrieve candidates from multiple methods
    const retrievalQuery: RetrievalQuery = {
      text: query.input,
      limit: 20, // Get more candidates for fusion
    };

    const candidateLists = await Promise.all(
      strategy.methods.map(async (method) => {
        const retriever = this.retrievers.get(method.toString());
        if (!retriever) {
          return [];
        }
        return await retriever.retrieve(retrievalQuery);
      }),
    );

    // Step 4: Fuse candidates from multiple methods
    const fusedCandidates = this.fusion.fuse(candidateLists);

    // Step 5: Rank candidates with intent-aware scoring
    const rankedCandidates = this.ranker.rank(
      fusedCandidates,
      intent,
      query.input,
    );

    // Step 6: Calculate token budget allocation
    const inputTokens = this.tokenCounter.countTokens(query.input);
    const budgetAllocation = this.budgetAllocator.allocate(
      query.tokenBudget,
      inputTokens,
      intent,
    );

    // Step 7: Pack candidates into context items within budget
    const contextBudget =
      budgetAllocation.allocations.get("context" as any) ?? 0;
    const packingResult = this.promptPacker.pack(
      rankedCandidates,
      contextBudget,
    );

    // Step 8: Return result
    return {
      items: packingResult.items,
      intent,
      tokensUsed: packingResult.tokensUsed,
      retrievalMethods: strategy.methods.map((m) => m.toString()),
    };
  }

  /**
   * Dispose of resources
   *
   * Cleans up:
   * - File watchers
   * - Database connections
   * - Cache
   */
  async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // TODO: Cleanup resources
    // - Stop file watcher
    // - Close database connections
    // - Clear cache

    this.initialized = false;
  }
}
