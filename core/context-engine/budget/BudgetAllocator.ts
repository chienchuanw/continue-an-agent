/**
 * Budget Allocator implementation
 *
 * Allocates token budget across different prompt sections.
 * Ensures optimal distribution based on intent and requirements.
 */

import { IntentType } from "../types";

/**
 * Prompt section types
 */
export enum PromptSection {
  SYSTEM = "system",
  CONTEXT = "context",
  TASK = "task",
  INPUT = "input",
  OUTPUT = "output",
}

/**
 * Budget allocation result
 */
export interface BudgetAllocation {
  /** Total budget available */
  totalBudget: number;

  /** Allocation per section */
  allocations: Map<PromptSection, number>;

  /** Reserved tokens (safety margin) */
  reserved: number;
}

/**
 * Budget Allocator configuration
 */
export interface BudgetAllocatorConfig {
  /** System prompt token count (fixed) */
  systemTokens: number;

  /** Minimum context tokens */
  minContextTokens: number;

  /** Maximum context tokens */
  maxContextTokens: number;

  /** Context allocation percentage (0-1) */
  contextPercentage: number;

  /** Task allocation percentage (0-1) */
  taskPercentage: number;

  /** Reserved tokens for safety margin */
  reservedTokens: number;
}

/**
 * Budget Allocator class
 *
 * Responsibilities:
 * - Allocate token budget across sections
 * - Adjust allocation based on intent
 * - Ensure minimum requirements are met
 * - Reserve safety margin
 */
export class BudgetAllocator {
  private config: BudgetAllocatorConfig;

  constructor(config?: Partial<BudgetAllocatorConfig>) {
    this.config = {
      systemTokens: config?.systemTokens ?? 50,
      minContextTokens: config?.minContextTokens ?? 20,
      maxContextTokens: config?.maxContextTokens ?? 8000,
      contextPercentage: config?.contextPercentage ?? 0.5,
      taskPercentage: config?.taskPercentage ?? 0.1,
      reservedTokens: config?.reservedTokens ?? 10,
    };
  }

  /**
   * Allocate token budget
   */
  allocate(
    totalBudget: number,
    inputTokens: number,
    intent?: IntentType,
  ): BudgetAllocation {
    // Validate budget
    if (totalBudget <= 0) {
      throw new Error("Total budget must be positive");
    }

    // Calculate available budget after fixed costs
    const fixedCosts = this.config.systemTokens + this.config.reservedTokens;
    const availableBudget = totalBudget - fixedCosts - inputTokens;

    if (availableBudget <= 0) {
      throw new Error(
        `Insufficient budget: need at least ${fixedCosts + inputTokens} tokens, got ${totalBudget}`,
      );
    }

    // Adjust percentages based on intent
    const { contextPercentage, taskPercentage } =
      this.adjustPercentagesForIntent(intent);

    // Calculate allocations
    const allocations = new Map<PromptSection, number>();

    // Fixed: SYSTEM
    allocations.set(PromptSection.SYSTEM, this.config.systemTokens);

    // Fixed: INPUT
    allocations.set(PromptSection.INPUT, inputTokens);

    // Variable: CONTEXT (40-60% of available budget)
    let contextTokens = Math.floor(availableBudget * contextPercentage);
    contextTokens = Math.max(
      this.config.minContextTokens,
      Math.min(this.config.maxContextTokens, contextTokens),
    );
    allocations.set(PromptSection.CONTEXT, contextTokens);

    // Variable: TASK (5-10% of available budget)
    const taskTokens = Math.floor(availableBudget * taskPercentage);
    allocations.set(PromptSection.TASK, taskTokens);

    // Remaining: OUTPUT
    const usedTokens =
      this.config.systemTokens +
      inputTokens +
      contextTokens +
      taskTokens +
      this.config.reservedTokens;
    const outputTokens = Math.max(0, totalBudget - usedTokens);
    allocations.set(PromptSection.OUTPUT, outputTokens);

    return {
      totalBudget,
      allocations,
      reserved: this.config.reservedTokens,
    };
  }

  /**
   * Adjust allocation percentages based on intent
   */
  private adjustPercentagesForIntent(intent?: IntentType): {
    contextPercentage: number;
    taskPercentage: number;
  } {
    if (!intent) {
      return {
        contextPercentage: this.config.contextPercentage,
        taskPercentage: this.config.taskPercentage,
      };
    }

    switch (intent) {
      case IntentType.EXPLAIN:
        // More context for explanations
        return { contextPercentage: 0.6, taskPercentage: 0.05 };

      case IntentType.BUG_FIX:
        // Balanced context and task
        return { contextPercentage: 0.5, taskPercentage: 0.1 };

      case IntentType.REFACTOR:
        // More context for understanding structure
        return { contextPercentage: 0.55, taskPercentage: 0.1 };

      case IntentType.GENERATE:
        // Less context, more output space
        return { contextPercentage: 0.4, taskPercentage: 0.1 };

      case IntentType.TEST:
        // Balanced
        return { contextPercentage: 0.5, taskPercentage: 0.1 };

      default:
        return {
          contextPercentage: this.config.contextPercentage,
          taskPercentage: this.config.taskPercentage,
        };
    }
  }

  /**
   * Get allocation summary
   */
  getAllocationSummary(allocation: BudgetAllocation): string {
    const lines: string[] = [];
    lines.push(`Total Budget: ${allocation.totalBudget} tokens`);
    lines.push(`Reserved: ${allocation.reserved} tokens`);
    lines.push("\nAllocations:");

    for (const [section, tokens] of allocation.allocations.entries()) {
      const percentage = ((tokens / allocation.totalBudget) * 100).toFixed(1);
      lines.push(`  ${section}: ${tokens} tokens (${percentage}%)`);
    }

    return lines.join("\n");
  }
}
