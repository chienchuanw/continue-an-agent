/**
 * LLM Client Interface
 *
 * This interface defines the contract for all LLM providers in the system.
 * It enforces a clean abstraction layer between the Core Engine and specific
 * LLM implementations (Claude, OpenAI, etc.).
 *
 * Design Principles:
 * - Model-agnostic: Works with any LLM provider
 * - Streaming-first: All operations support streaming
 * - Context-aware: Accepts context from Context Engine
 *
 * @see docs/architecture.md - Section 3.3.1 LLM Abstraction Layer
 * @see docs/roadmap.md - Phase 0.2 LLM Provider Abstraction
 */

import { ChatMessage, CompletionOptions, PromptLog } from "../index.js";

/**
 * Context information passed to LLM operations.
 * This will be populated by the Context Engine in later phases.
 */
export interface LLMContext {
  /**
   * Token budget allocated for this request.
   * The LLM client must respect this limit.
   */
  tokenBudget?: number;

  /**
   * Additional metadata for the request.
   * Can include file paths, intent classification, etc.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result from agent execution.
 * Used for multi-step tasks with tool invocation.
 */
export interface AgentResult {
  /**
   * Final response from the agent
   */
  response: string;

  /**
   * Steps taken by the agent
   */
  steps: AgentStep[];

  /**
   * Token usage information
   */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Individual step in agent execution
 */
export interface AgentStep {
  /**
   * Type of step (thought, tool_call, observation)
   */
  type: "thought" | "tool_call" | "observation";

  /**
   * Content of the step
   */
  content: string;

  /**
   * Tool name if type is tool_call
   */
  toolName?: string;

  /**
   * Tool input if type is tool_call
   */
  toolInput?: Record<string, unknown>;
}

/**
 * Tool definition for agent execution
 */
export interface AgentTool {
  /**
   * Unique name of the tool
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * JSON Schema for tool input
   */
  inputSchema: Record<string, unknown>;

  /**
   * Function to execute the tool
   */
  run: (input: Record<string, unknown>) => Promise<string>;
}

/**
 * Core LLM Client Interface
 *
 * All LLM providers must implement this interface.
 * This ensures consistent behavior across different models.
 */
export interface ILLMClient {
  /**
   * Provider name (e.g., "anthropic", "openai")
   */
  readonly providerName: string;

  /**
   * Stream chat completion
   *
   * @param messages - Conversation history
   * @param signal - Abort signal for cancellation
   * @param context - Context information from Context Engine
   * @param options - Completion options (temperature, maxTokens, etc.)
   * @returns Async iterable of chat message chunks
   */
  streamChat(
    messages: ChatMessage[],
    signal: AbortSignal,
    context?: LLMContext,
    options?: CompletionOptions,
  ): AsyncIterable<ChatMessage>;

  /**
   * Complete inline suggestion (for autocomplete)
   *
   * @param prefix - Code before cursor
   * @param suffix - Code after cursor
   * @param signal - Abort signal for cancellation
   * @param context - Context information
   * @param options - Completion options
   * @returns Async iterable of completion text chunks
   */
  completeInline(
    prefix: string,
    suffix: string,
    signal: AbortSignal,
    context?: LLMContext,
    options?: CompletionOptions,
  ): AsyncIterable<string>;
}
