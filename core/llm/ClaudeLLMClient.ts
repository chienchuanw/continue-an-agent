/**
 * Claude LLM Client Adapter
 *
 * This adapter wraps the existing Anthropic provider to implement the ILLMClient interface.
 * It provides a clean abstraction layer for Claude models (Haiku, Sonnet, Opus).
 *
 * Design:
 * - Delegates to existing Anthropic class for actual API calls
 * - Implements ILLMClient interface for consistency
 * - Supports model routing (Haiku for autocomplete, Sonnet for chat, Opus for complex tasks)
 *
 * @see core/llm/llms/Anthropic.ts - Underlying implementation
 * @see docs/roadmap.md - Phase 0.2 LLM Provider Abstraction
 */

import { ChatMessage, CompletionOptions, LLMOptions } from "../index.js";
import { ILLMClient, LLMContext } from "./ILLMClient.interface.js";
import Anthropic from "./llms/Anthropic.js";

/**
 * Configuration options for ClaudeLLMClient
 */
export interface ClaudeLLMClientOptions {
  /**
   * Anthropic API key
   */
  apiKey: string;

  /**
   * Model to use (e.g., "claude-3-5-sonnet-latest")
   */
  model: string;

  /**
   * Optional API base URL
   */
  apiBase?: string;

  /**
   * Optional completion options
   */
  completionOptions?: Partial<CompletionOptions>;
}

/**
 * Claude LLM Client
 *
 * Implements ILLMClient interface using Anthropic provider.
 */
export class ClaudeLLMClient implements ILLMClient {
  private anthropic: Anthropic;

  readonly providerName = "anthropic";

  constructor(options: ClaudeLLMClientOptions) {
    // Convert options to LLMOptions format expected by Anthropic class
    const llmOptions: LLMOptions = {
      model: options.model,
      apiKey: options.apiKey,
      apiBase: options.apiBase,
      completionOptions: {
        model: options.model,
        maxTokens: options.completionOptions?.maxTokens ?? 8192,
        temperature: options.completionOptions?.temperature,
        topP: options.completionOptions?.topP,
        ...options.completionOptions,
      },
    };

    this.anthropic = new Anthropic(llmOptions);
  }

  /**
   * Stream chat completion
   *
   * Delegates to Anthropic.streamChat() and adapts the interface.
   */
  async *streamChat(
    messages: ChatMessage[],
    signal: AbortSignal,
    context?: LLMContext,
    options?: CompletionOptions,
  ): AsyncIterable<ChatMessage> {
    // Merge context token budget into options if provided
    // Ensure model is always present (required by CompletionOptions interface)
    const mergedOptions: CompletionOptions = {
      model: this.anthropic.model, // Use the model from the Anthropic instance
      ...options,
      maxTokens: context?.tokenBudget ?? options?.maxTokens,
    };

    // Delegate to underlying Anthropic implementation
    // The Anthropic class already implements streamChat
    yield* this.anthropic.streamChat(messages, signal, mergedOptions);
  }

  /**
   * Complete inline suggestion
   *
   * For inline completion, we construct a prompt from prefix/suffix
   * and use the chat interface with a system message optimized for code completion.
   */
  async *completeInline(
    prefix: string,
    suffix: string,
    signal: AbortSignal,
    context?: LLMContext,
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    // Construct completion prompt
    const prompt = this.buildInlineCompletionPrompt(prefix, suffix);

    const messages: ChatMessage[] = [
      {
        role: "user",
        content: prompt,
      },
    ];

    // Merge context token budget into options
    // Ensure model is always present (required by CompletionOptions interface)
    const mergedOptions: CompletionOptions = {
      model: this.anthropic.model, // Use the model from the Anthropic instance
      ...options,
      maxTokens: context?.tokenBudget ?? options?.maxTokens ?? 256,
      temperature: options?.temperature ?? 0.2, // Lower temperature for code completion
    };

    // Stream chat and extract text content
    for await (const message of this.anthropic.streamChat(
      messages,
      signal,
      mergedOptions,
    )) {
      if (typeof message.content === "string") {
        yield message.content;
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "text") {
            yield part.text;
          }
        }
      }
    }
  }

  /**
   * Build prompt for inline code completion
   */
  private buildInlineCompletionPrompt(prefix: string, suffix: string): string {
    return `Complete the code at the cursor position. Only return the completion, no explanations.

Prefix:
${prefix}

Suffix:
${suffix}

Completion:`;
  }
}
