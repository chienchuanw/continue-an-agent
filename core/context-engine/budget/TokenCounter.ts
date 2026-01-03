/**
 * Token Counter implementation
 *
 * Counts tokens in text using a tokenizer.
 * Essential for token budget optimization.
 */

/**
 * Token Counter configuration
 */
export interface TokenCounterConfig {
  /** Model name for tokenizer (e.g., "gpt-4", "claude-3") */
  modelName: string;

  /** Average characters per token (fallback if no tokenizer) */
  avgCharsPerToken: number;
}

/**
 * Token Counter class
 *
 * Responsibilities:
 * - Count tokens in text
 * - Support multiple tokenizer backends
 * - Provide fallback estimation
 * - Cache token counts for performance
 */
export class TokenCounter {
  private config: TokenCounterConfig;
  private cache: Map<string, number>;

  constructor(config?: Partial<TokenCounterConfig>) {
    this.config = {
      modelName: config?.modelName ?? "gpt-4",
      avgCharsPerToken: config?.avgCharsPerToken ?? 4,
    };
    this.cache = new Map();
  }

  /**
   * Count tokens in text
   *
   * Uses actual tokenizer if available, otherwise estimates.
   */
  countTokens(text: string): number {
    // Check cache first
    const cached = this.cache.get(text);
    if (cached !== undefined) {
      return cached;
    }

    // Count tokens
    const count = this.countTokensInternal(text);

    // Cache result
    this.cache.set(text, count);

    return count;
  }

  /**
   * Count tokens in multiple texts
   */
  countTokensInTexts(texts: string[]): number {
    return texts.reduce((total, text) => total + this.countTokens(text), 0);
  }

  /**
   * Estimate tokens from character count
   *
   * Useful for quick approximations.
   */
  estimateTokens(charCount: number): number {
    return Math.ceil(charCount / this.config.avgCharsPerToken);
  }

  /**
   * Clear token count cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Internal token counting implementation
   *
   * TODO: Integrate with actual tokenizer (tiktoken, transformers.js)
   * For now, uses character-based estimation.
   */
  private countTokensInternal(text: string): number {
    // Fallback: estimate based on character count
    // This is a rough approximation:
    // - English text: ~4 chars per token
    // - Code: ~3-5 chars per token
    // - Special characters and whitespace affect this

    // More accurate estimation considering:
    // - Words are typically 1 token
    // - Punctuation is typically 1 token
    // - Numbers can be multiple tokens
    // - Code symbols are typically 1 token each

    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const punctuation = (text.match(/[.,;:!?(){}[\]<>]/g) || []).length;
    const numbers = (text.match(/\d+/g) || []).length;

    // Rough estimation:
    // - Each word: 1 token
    // - Each punctuation: 1 token
    // - Each number: 1-2 tokens (average 1.5)
    const estimatedTokens = words.length + punctuation + numbers * 1.5;

    return Math.ceil(estimatedTokens);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Track hits/misses
    };
  }
}
