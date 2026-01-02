---
type: "always_apply"
---

# Coding Standards

## agent-naan × Continue.dev × Claude 4.5

This document defines **mandatory coding conventions** for all code contributions.

These standards exist to:

- Ensure consistency across the codebase
- Maintain strict module boundaries
- Enable safe refactoring and evolution
- Prevent security vulnerabilities
- Facilitate code review and collaboration

All code MUST comply with these standards before merge.

---

## 1. Language Priorities

### 1.1 Primary Language: TypeScript

- **All new code** MUST be written in TypeScript
- **Strict mode** is mandatory (`strict: true` in tsconfig.json)
- **No `any` types** except in explicitly documented edge cases
- **No type assertions** (`as`) without justification in comments

### 1.2 Secondary Language: Python

- Used only for:
  - Embedding model inference scripts
  - Data processing pipelines
  - Testing utilities
- **Type hints** are mandatory (PEP 484)
- **Python 3.10+** minimum version

---

## 2. TypeScript Conventions

### 2.1 Naming Conventions

```typescript
// Interfaces: PascalCase with 'I' prefix for pure interfaces
interface ILLMClient {
  streamChat(messages: Message[]): AsyncIterable<Token>;
}

// Types: PascalCase without prefix
type ContextQuery = {
  intent: Intent;
  tokenBudget: number;
};

// Classes: PascalCase
class ContextEngine {
  private readonly indexer: Indexer;
}

// Functions: camelCase
function buildPrompt(context: Context): string {
  // ...
}

// Constants: UPPER_SNAKE_CASE
const MAX_TOKEN_BUDGET = 8000;
const DEFAULT_MODEL = "claude-sonnet-4.5";

// Enums: PascalCase for enum, UPPER_SNAKE_CASE for values
enum RetrievalStrategy {
  SEMANTIC = "SEMANTIC",
  LEXICAL = "LEXICAL",
  DEPENDENCY_WALK = "DEPENDENCY_WALK",
}

// Private members: prefix with underscore
class Example {
  private _internalState: State;

  public get state(): State {
    return this._internalState;
  }
}
```

### 2.2 File Naming

```text
src/
  core/
    context-engine.ts          # kebab-case for modules
    llm-client.interface.ts    # .interface.ts for interface definitions
    context-query.type.ts      # .type.ts for type definitions
    retrieval.constants.ts     # .constants.ts for constants
  __tests__/
    context-engine.test.ts     # .test.ts for unit tests
    integration.spec.ts        # .spec.ts for integration tests
```

### 2.3 Import Organization

```typescript
// 1. Node built-ins
import * as path from "path";
import * as fs from "fs/promises";

// 2. External dependencies
import * as vscode from "vscode";
import { Anthropic } from "@anthropic-ai/sdk";

// 3. Internal absolute imports (from src/)
import { ContextEngine } from "@/core/context-engine";
import { ILLMClient } from "@/core/llm-client.interface";

// 4. Relative imports (same module)
import { buildPrompt } from "./prompt-builder";
import type { PromptSection } from "./types";
```

### 2.4 Type Safety

```typescript
// GOOD: Explicit types
function processContext(query: ContextQuery, budget: number): Promise<Context> {
  // ...
}

// BAD: Implicit any
function processContext(query, budget) {
  // ...
}

// GOOD: Discriminated unions
type Result<T> = { success: true; data: T } | { success: false; error: Error };

// GOOD: Readonly by default
interface Config {
  readonly maxTokens: number;
  readonly model: string;
}

// GOOD: Const assertions
const MODELS = {
  HAIKU: "claude-haiku-4.5",
  SONNET: "claude-sonnet-4.5",
  OPUS: "claude-opus-4.5",
} as const;

type Model = (typeof MODELS)[keyof typeof MODELS];
```

### 2.5 Async/Await Patterns

```typescript
// GOOD: Explicit error handling
async function fetchContext(query: string): Promise<Context> {
  try {
    const result = await contextEngine.query(query);
    return result;
  } catch (error) {
    logger.error("Context fetch failed", { query, error });
    throw new ContextFetchError("Failed to fetch context", { cause: error });
  }
}

// GOOD: AsyncIterable for streams
async function* streamTokens(prompt: string): AsyncIterable<Token> {
  const stream = await llmClient.streamChat(prompt);

  for await (const token of stream) {
    yield token;
  }
}

// BAD: Unhandled promise rejection
async function badExample() {
  contextEngine.query("test"); // Missing await, no error handling
}
```

---

## 3. Code Style & Formatting

### 3.1 Tooling (Mandatory)

- **ESLint**: Enforce code quality rules
- **Prettier**: Enforce consistent formatting
- **TypeScript Compiler**: Strict mode enabled

### 3.2 ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 3.3 Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 4. Documentation Standards

### 4.1 TSDoc Comments

````typescript
/**
 * Retrieves relevant context for a given query using the Context Engine.
 *
 * This function orchestrates the full context retrieval pipeline:
 * 1. Intent classification
 * 2. Candidate retrieval
 * 3. Ranking and scoring
 * 4. Token budget allocation
 *
 * @param query - The user's natural language query
 * @param options - Optional configuration for retrieval strategy
 * @returns Promise resolving to ranked context items
 * @throws {ContextEngineError} When retrieval fails or budget is exceeded
 *
 * @example
 * ```typescript
 * const context = await retrieveContext("explain this error", {
 *   tokenBudget: 4000,
 *   strategy: RetrievalStrategy.SEMANTIC
 * });
 * ```
 */
async function retrieveContext(
  query: string,
  options?: RetrievalOptions
): Promise<Context> {
  // Implementation
}
````

### 4.2 Inline Comments

```typescript
// GOOD: Explain WHY, not WHAT
// Use semantic search first because error messages often lack exact keywords
const candidates = await semanticRetriever.search(query);

// BAD: Redundant comment
// Loop through candidates
for (const candidate of candidates) {
  // ...
}

// GOOD: Document non-obvious behavior
// LanceDB returns results in arbitrary order, so we must sort by score
const sorted = candidates.sort((a, b) => b.score - a.score);

// GOOD: Mark intentional deviations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: VSCode API returns untyped objects for webview messages
function handleMessage(message: any): void {
  // ...
}
```

### 4.3 Module-Level Documentation

```typescript
/**
 * @module core/context-engine
 *
 * The Context Engine is the core intelligence layer that determines
 * what information the LLM should see for any given request.
 *
 * **Architecture**:
 * - Indexer: Maintains embeddings and metadata
 * - Retriever: Fetches candidate context items
 * - Ranker: Scores and orders candidates
 * - Packer: Fits context within token budget
 *
 * **Key Constraints**:
 * - MUST respect token budgets (hard limit)
 * - MUST NOT mutate prompts outside this module
 * - MUST provide deterministic ordering
 *
 * @see {@link docs/context-engine.md} for full specification
 */
```

---

## 5. Error Handling

### 5.1 Custom Error Classes

```typescript
// GOOD: Domain-specific error hierarchy
class ContextEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ContextEngineError";
  }
}

class TokenBudgetExceededError extends ContextEngineError {
  constructor(requested: number, available: number) {
    super(
      `Token budget exceeded: requested ${requested}, available ${available}`,
      "TOKEN_BUDGET_EXCEEDED",
      { requested, available }
    );
  }
}
```

### 5.2 Error Handling Patterns

```typescript
// GOOD: Fail-fast with context
function validateTokenBudget(budget: number): void {
  if (budget <= 0) {
    throw new TokenBudgetExceededError(budget, 0);
  }

  if (budget > MAX_TOKEN_BUDGET) {
    throw new TokenBudgetExceededError(budget, MAX_TOKEN_BUDGET);
  }
}

// GOOD: Graceful degradation with logging
async function retrieveWithFallback(query: string): Promise<Context> {
  try {
    return await semanticRetriever.search(query);
  } catch (error) {
    logger.warn("Semantic search failed, falling back to lexical", {
      query,
      error,
    });
    return await lexicalRetriever.search(query);
  }
}

// GOOD: Result type for expected failures
type RetrievalResult =
  | { success: true; context: Context }
  | { success: false; reason: string };

async function tryRetrieve(query: string): Promise<RetrievalResult> {
  try {
    const context = await retrieve(query);
    return { success: true, context };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

## 6. Module Boundaries & Architecture

### 6.1 Strict Layer Separation

```typescript
// FORBIDDEN: UI calling LLM directly
// File: src/ui/chat-panel.ts
const response = await anthropic.messages.create({ ... }); // VIOLATION

// CORRECT: UI sends event to Extension Layer
// File: src/ui/chat-panel.ts
webview.postMessage({
  type: "chat-request",
  payload: { message: userInput }
});

// CORRECT: Extension Layer delegates to Core
// File: src/extension/message-handler.ts
const response = await coreEngine.processChat(message);
```

### 6.2 Dependency Rules

```text
Allowed dependencies:

VSCode UI Layer
  ↓ (can import)
  Extension Layer types only

Extension Layer
  ↓ (can import)
  Core Engine public API

Core Engine
  ↓ (can import)
  Local Services

FORBIDDEN:
  Core → Extension
  Core → VSCode UI
  Local Services → Core
```

### 6.3 Interface Segregation

```typescript
// GOOD: Small, focused interfaces
interface IContextRetriever {
  search(query: string): Promise<ContextItem[]>;
}

interface IContextRanker {
  rank(items: ContextItem[]): ContextItem[];
}

interface IPromptPacker {
  pack(items: ContextItem[], budget: number): string;
}

// BAD: God interface
interface IContextEngine {
  search(query: string): Promise<ContextItem[]>;
  rank(items: ContextItem[]): ContextItem[];
  pack(items: ContextItem[], budget: number): string;
  index(files: string[]): Promise<void>;
  embed(text: string): Promise<number[]>;
  // ... 20 more methods
}
```

---

## 7. Testing Standards

### 7.1 Test File Organization

```text
src/
  core/
    context-engine.ts
    __tests__/
      context-engine.test.ts        # Unit tests
      context-engine.integration.ts # Integration tests
```

### 7.2 Test Naming

```typescript
describe("ContextEngine", () => {
  describe("query()", () => {
    it("should return ranked context items for valid query", async () => {
      // Arrange
      const engine = new ContextEngine(mockIndexer, mockRetriever);
      const query = "explain this error";

      // Act
      const result = await engine.query(query);

      // Assert
      expect(result.items).toHaveLength(3);
      expect(result.items[0].score).toBeGreaterThan(result.items[1].score);
    });

    it("should throw TokenBudgetExceededError when budget is negative", async () => {
      const engine = new ContextEngine(mockIndexer, mockRetriever);

      await expect(engine.query("test", { tokenBudget: -100 })).rejects.toThrow(
        TokenBudgetExceededError
      );
    });
  });
});
```

### 7.3 Test Coverage Requirements

- **Minimum coverage**: 80% for Core Engine modules
- **Critical paths**: 100% coverage for:
  - Context Engine
  - Prompt Assembly
  - Permission checks
  - Error handling

---

## 8. Security Practices

### 8.1 Input Validation

```typescript
// GOOD: Validate all external inputs
function validateUserQuery(query: string): void {
  if (typeof query !== "string") {
    throw new ValidationError("Query must be a string");
  }

  if (query.length === 0) {
    throw new ValidationError("Query cannot be empty");
  }

  if (query.length > MAX_QUERY_LENGTH) {
    throw new ValidationError(
      `Query exceeds maximum length of ${MAX_QUERY_LENGTH}`
    );
  }
}

// GOOD: Sanitize file paths
function validateFilePath(filePath: string): string {
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(workspaceRoot, normalized);

  if (!resolved.startsWith(workspaceRoot)) {
    throw new SecurityError("Path traversal detected");
  }

  return resolved;
}
```

### 8.2 Secrets Management

```typescript
// FORBIDDEN: Hardcoded secrets
const API_KEY = "sk-ant-1234567890"; // VIOLATION

// CORRECT: Environment variables
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  throw new ConfigError("ANTHROPIC_API_KEY environment variable not set");
}

// CORRECT: Secure storage for user secrets
import { SecretStorage } from "vscode";

async function getApiKey(secrets: SecretStorage): Promise<string> {
  const key = await secrets.get("anthropic-api-key");
  if (!key) {
    throw new ConfigError("API key not found in secure storage");
  }
  return key;
}
```

### 8.3 Command Execution

```typescript
// FORBIDDEN: Arbitrary command execution
exec(userInput); // VIOLATION

// CORRECT: Allowlist-based execution
const ALLOWED_COMMANDS = new Set(["npm test", "npm run build", "git status"]);

function executeCommand(command: string): void {
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new SecurityError(`Command not allowed: ${command}`);
  }

  exec(command, { timeout: 30000 });
}
```

---

## 9. Performance Guidelines

### 9.1 Async Operations

```typescript
// GOOD: Parallel execution
const [context, diagnostics, symbols] = await Promise.all([
  contextEngine.query(query),
  getDiagnostics(activeFile),
  getSymbols(activeFile),
]);

// BAD: Sequential execution
const context = await contextEngine.query(query);
const diagnostics = await getDiagnostics(activeFile);
const symbols = await getSymbols(activeFile);
```

### 9.2 Caching

```typescript
// GOOD: Cache expensive operations
class EmbeddingCache {
  private cache = new Map<string, number[]>();

  async getEmbedding(text: string): Promise<number[]> {
    const cached = this.cache.get(text);
    if (cached) {
      return cached;
    }

    const embedding = await this.model.embed(text);
    this.cache.set(text, embedding);
    return embedding;
  }

  invalidate(text: string): void {
    this.cache.delete(text);
  }
}
```

### 9.3 Memory Management

```typescript
// GOOD: Dispose resources
class ContextEngine implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(this.handleSave.bind(this))
    );
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
```

---

## 10. Python Conventions (Secondary)

### 10.1 Type Hints (Mandatory)

```python
from typing import List, Optional, AsyncIterator

# GOOD: Full type annotations
async def embed_text(
    text: str,
    model: str = "text-embedding-3-small"
) -> List[float]:
    """Generate embeddings for the given text."""
    # Implementation
    pass

# BAD: Missing type hints
async def embed_text(text, model="text-embedding-3-small"):
    pass
```

### 10.2 Naming Conventions

```python
# Constants: UPPER_SNAKE_CASE
MAX_BATCH_SIZE = 100
DEFAULT_MODEL = "text-embedding-3-small"

# Functions: snake_case
def process_embeddings(texts: List[str]) -> List[List[float]]:
    pass

# Classes: PascalCase
class EmbeddingModel:
    def __init__(self, model_name: str) -> None:
        self._model_name = model_name
```

### 10.3 Docstrings (Google Style)

```python
def retrieve_context(
    query: str,
    top_k: int = 10
) -> List[ContextItem]:
    """Retrieve relevant context items for a query.

    Args:
        query: The search query string
        top_k: Maximum number of results to return

    Returns:
        List of context items sorted by relevance score

    Raises:
        ValueError: If query is empty or top_k is negative

    Example:
        >>> items = retrieve_context("explain error", top_k=5)
        >>> len(items)
        5
    """
    pass
```

---

## 11. Git Commit Conventions

### 11.1 Commit Message Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### 11.2 Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### 11.3 Examples

```text
feat(context-engine): implement semantic retrieval

- Add LanceDB integration for vector search
- Implement chunking at function/class level
- Add background indexing on file save

Closes #42

---

fix(prompt-assembly): prevent token budget overflow

The prompt packer was not accounting for system prompt tokens,
causing budget overruns. Now includes all sections in calculation.

Fixes #58

---

docs(architecture): clarify module boundary rules

Add explicit examples of allowed/forbidden dependencies
between layers to prevent violations.
```

---

## 12. Code Review Checklist

Before submitting code for review, verify:

- [ ] All TypeScript code passes `tsc --noEmit` with no errors
- [ ] ESLint shows no errors (`npm run lint`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] All tests pass (`npm test`)
- [ ] Test coverage meets minimum requirements
- [ ] No `any` types without justification
- [ ] No `console.log` statements (use logger)
- [ ] Module boundaries respected (no layer violations)
- [ ] TSDoc comments added for public APIs
- [ ] Error handling implemented for all async operations
- [ ] No hardcoded secrets or credentials
- [ ] Commit messages follow convention

---

## 13. Enforcement

### 13.1 Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write", "git add"],
    "*.py": ["black", "mypy", "git add"]
  }
}
```

### 13.2 CI/CD Checks

All pull requests MUST pass:

1. TypeScript compilation (`tsc --noEmit`)
2. ESLint (`npm run lint`)
3. Prettier check (`npm run format:check`)
4. Unit tests (`npm test`)
5. Integration tests (`npm run test:integration`)
6. Coverage threshold (80% minimum)

### 13.3 Merge Blockers

The following are **automatic merge blockers**:

- TypeScript compilation errors
- ESLint errors (warnings allowed)
- Test failures
- Coverage below threshold
- Module boundary violations
- Hardcoded secrets

---

## 14. Language-Specific Notes

### 14.1 English Only

- All code, comments, documentation, and commit messages MUST be in English
- Variable names, function names, and identifiers MUST be in English
- No transliteration or mixed-language identifiers

### 14.2 Rationale

- Ensures consistency across international contributors
- Facilitates code review and collaboration
- Aligns with industry standards
- Improves searchability and tooling support

---

## 15. Summary

These coding standards are **non-negotiable** and enforced through:

- Automated tooling (ESLint, Prettier, TypeScript)
- Pre-commit hooks
- CI/CD pipeline checks
- Code review process

When in doubt, refer to:

1. This document
2. Existing codebase examples
3. Project architecture documentation
4. Team discussion

**Guiding Principle**:

> **Code is read more often than it is written.
> Optimize for clarity, safety, and maintainability.**
