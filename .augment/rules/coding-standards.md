---
type: "always_apply"
---

# Coding Standards

Mandatory conventions for all code. Enforced via ESLint, Prettier, TypeScript strict mode, and CI/CD.

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

- **Interfaces**: PascalCase with `I` prefix (`ILLMClient`)
- **Types**: PascalCase without prefix (`ContextQuery`)
- **Classes**: PascalCase (`ContextEngine`)
- **Functions**: camelCase (`buildPrompt`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TOKEN_BUDGET`)
- **Enums**: PascalCase for enum, UPPER_SNAKE_CASE for values
- **Private members**: prefix with underscore (`_internalState`)

### 2.2 File Naming

- Modules: kebab-case (`context-engine.ts`)
- Interfaces: `.interface.ts` suffix (`llm-client.interface.ts`)
- Types: `.type.ts` suffix (`context-query.type.ts`)
- Constants: `.constants.ts` suffix (`retrieval.constants.ts`)
- Unit tests: `.test.ts` suffix (`context-engine.test.ts`)
- Integration tests: `.spec.ts` suffix (`integration.spec.ts`)

### 2.3 Import Organization

1. Node built-ins
2. External dependencies
3. Internal absolute imports (from `src/`)
4. Relative imports (same module)

### 2.4 Type Safety

- Explicit types for all functions
- Discriminated unions for complex types
- Readonly by default for interfaces
- Const assertions for constants
- No `any` types (except with documented justification)
- No type assertions (`as`) without justification

### 2.5 Async/Await Patterns

- Always use `async/await` (not `.then()`)
- Explicit error handling with try/catch
- Use AsyncIterable for streams
- Never forget `await` on async operations
- No unhandled promise rejections

---

## 3. Code Style & Formatting

- **ESLint**: Enforce code quality (no `any`, no floating promises)
- **Prettier**: Consistent formatting (80 char width, 2-space tabs)
- **TypeScript**: Strict mode enabled, explicit return types

---

## 4. Documentation Standards

- **TSDoc**: All public APIs with `@param`, `@returns`, `@throws`, `@example`
- **Inline Comments**: Explain WHY, not WHAT. Document non-obvious behavior
- **Module Docs**: Include architecture, constraints, and references

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

- **Type Hints**: Mandatory (PEP 484), Python 3.10+
- **Naming**: Constants `UPPER_SNAKE_CASE`, functions `snake_case`, classes `PascalCase`
- **Docstrings**: Google style with Args, Returns, Raises, Example

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

All pull requests MUST pass:

1. TypeScript compilation (`tsc --noEmit`)
2. ESLint (`pnpm lint`)
3. Prettier check (`pnpm format:check`)
4. Unit tests (`pnpm test`)
5. Integration tests (`pnpm test:integration`)
6. Coverage threshold (80% minimum)

**Merge Blockers**: TypeScript errors, ESLint errors, test failures, coverage below threshold, module boundary violations, hardcoded secrets

---

## 14. Summary

Code is read more often than written. Optimize for clarity, safety, and maintainability.
