/**
 * RetrievalStrategySelector implementation
 *
 * Selects the optimal retrieval strategy based on user intent.
 * Different intents require different combinations of retrieval methods.
 */

import { IntentType } from "../types";

/**
 * Retrieval method types
 */
export enum RetrievalMethod {
  SEMANTIC = "semantic",
  LEXICAL = "lexical",
  DEPENDENCY = "dependency",
  RECENT_EDITS = "recent_edits",
}

/**
 * Retrieval strategy configuration
 */
export interface RetrievalStrategy {
  methods: RetrievalMethod[];
  weights: Map<RetrievalMethod, number>;
}

/**
 * RetrievalStrategySelector class
 *
 * Responsibilities:
 * - Map intent to retrieval methods
 * - Assign weights to each method
 * - Provide strategy configuration
 */
export class RetrievalStrategySelector {
  /**
   * Select retrieval strategy based on intent
   */
  selectStrategy(intent: IntentType): RetrievalStrategy {
    switch (intent) {
      case IntentType.EXPLAIN:
        return this.getExplainStrategy();

      case IntentType.BUG_FIX:
        return this.getBugFixStrategy();

      case IntentType.REFACTOR:
        return this.getRefactorStrategy();

      case IntentType.GENERATE:
        return this.getGenerateStrategy();

      case IntentType.TEST:
        return this.getTestStrategy();

      default:
        return this.getExplainStrategy();
    }
  }

  /**
   * Strategy for EXPLAIN intent
   * Focus: Semantic understanding + lexical search
   */
  private getExplainStrategy(): RetrievalStrategy {
    const weights = new Map<RetrievalMethod, number>();
    weights.set(RetrievalMethod.SEMANTIC, 0.6);
    weights.set(RetrievalMethod.LEXICAL, 0.3);
    weights.set(RetrievalMethod.DEPENDENCY, 0.1);

    return {
      methods: [
        RetrievalMethod.SEMANTIC,
        RetrievalMethod.LEXICAL,
        RetrievalMethod.DEPENDENCY,
      ],
      weights,
    };
  }

  /**
   * Strategy for BUG_FIX intent
   * Focus: Recent edits + semantic + dependency graph
   */
  private getBugFixStrategy(): RetrievalStrategy {
    const weights = new Map<RetrievalMethod, number>();
    weights.set(RetrievalMethod.RECENT_EDITS, 0.4);
    weights.set(RetrievalMethod.SEMANTIC, 0.3);
    weights.set(RetrievalMethod.DEPENDENCY, 0.2);
    weights.set(RetrievalMethod.LEXICAL, 0.1);

    return {
      methods: [
        RetrievalMethod.RECENT_EDITS,
        RetrievalMethod.SEMANTIC,
        RetrievalMethod.DEPENDENCY,
        RetrievalMethod.LEXICAL,
      ],
      weights,
    };
  }

  /**
   * Strategy for REFACTOR intent
   * Focus: Dependency graph + semantic
   */
  private getRefactorStrategy(): RetrievalStrategy {
    const weights = new Map<RetrievalMethod, number>();
    weights.set(RetrievalMethod.DEPENDENCY, 0.5);
    weights.set(RetrievalMethod.SEMANTIC, 0.4);
    weights.set(RetrievalMethod.LEXICAL, 0.1);

    return {
      methods: [
        RetrievalMethod.DEPENDENCY,
        RetrievalMethod.SEMANTIC,
        RetrievalMethod.LEXICAL,
      ],
      weights,
    };
  }

  /**
   * Strategy for GENERATE intent
   * Focus: Semantic + lexical
   */
  private getGenerateStrategy(): RetrievalStrategy {
    const weights = new Map<RetrievalMethod, number>();
    weights.set(RetrievalMethod.SEMANTIC, 0.6);
    weights.set(RetrievalMethod.LEXICAL, 0.3);
    weights.set(RetrievalMethod.DEPENDENCY, 0.1);

    return {
      methods: [
        RetrievalMethod.SEMANTIC,
        RetrievalMethod.LEXICAL,
        RetrievalMethod.DEPENDENCY,
      ],
      weights,
    };
  }

  /**
   * Strategy for TEST intent
   * Focus: Dependency graph + semantic
   */
  private getTestStrategy(): RetrievalStrategy {
    const weights = new Map<RetrievalMethod, number>();
    weights.set(RetrievalMethod.DEPENDENCY, 0.4);
    weights.set(RetrievalMethod.SEMANTIC, 0.4);
    weights.set(RetrievalMethod.LEXICAL, 0.2);

    return {
      methods: [
        RetrievalMethod.DEPENDENCY,
        RetrievalMethod.SEMANTIC,
        RetrievalMethod.LEXICAL,
      ],
      weights,
    };
  }
}
