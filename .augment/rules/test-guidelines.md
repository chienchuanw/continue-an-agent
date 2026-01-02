# Testing Guidelines

## agent-naan × Continue.dev × Claude 4.5

This document defines **comprehensive testing standards** for all code contributions using Vitest (TypeScript) and pytest (Python).

Testing is **mandatory** and enforced through CI/CD. All code must meet coverage requirements before merge.

---

## 1. Testing Philosophy

### 1.1 Core Principles

1. **Tests are first-class code** - Maintain the same quality standards as production code
2. **Test behavior, not implementation** - Focus on what code does, not how it does it
3. **Fast feedback loops** - Tests should run quickly and provide clear failure messages
4. **Deterministic results** - Tests must produce consistent results across environments
5. **Fail-safe testing** - Critical paths require 100% coverage

### 1.2 Testing Pyramid

```text
        ┌─────────────┐
        │   E2E (5%)  │  VSCode Extension workflows
        ├─────────────┤
        │ Integration │  Module interactions, API contracts
        │    (15%)    │
        ├─────────────┤
        │    Unit     │  Individual functions, classes
        │    (80%)    │  Core logic, edge cases
        └─────────────┘
```

### 1.3 Coverage Requirements

| Module Type       | Minimum Coverage | Critical Paths |
| ----------------- | ---------------- | -------------- |
| Core Engine       | 80%              | 100%           |
| Context Engine    | 80%              | 100%           |
| Prompt Assembly   | 80%              | 100%           |
| Permission Checks | 100%             | 100%           |
| Security Gates    | 100%             | 100%           |
| Extension Layer   | 70%              | N/A            |
| UI Layer          | 60%              | N/A            |
| Utilities         | 80%              | N/A            |

**Critical Paths (100% Required):**

- Context Engine retrieval pipeline
- Prompt assembly and token budgeting
- Permission checks and security gates
- Error handling and recovery
- Input validation and sanitization

---

## 2. TypeScript Testing with Vitest

### 2.1 Test File Organization

```text
src/
  core/
    context-engine.ts
    __tests__/
      context-engine.test.ts        # Unit tests
      context-engine.integration.ts # Integration tests
      fixtures/                     # Test data
        sample-context.json
      mocks/                        # Mock implementations
        mock-retriever.ts
```

### 2.2 File Naming Conventions

- **Unit tests**: `*.test.ts` (e.g., `context-engine.test.ts`)
- **Integration tests**: `*.spec.ts` or `*.integration.ts`
- **E2E tests**: `*.e2e.ts` in `test/e2e/` directory
- **Test fixtures**: `fixtures/*.json` or `fixtures/*.ts`
- **Mocks**: `mocks/mock-*.ts`

### 2.3 Test Structure (Arrange-Act-Assert)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ContextEngine } from "../context-engine";
import { mockIndexer, mockRetriever } from "./mocks";

describe("ContextEngine", () => {
  let engine: ContextEngine;

  beforeEach(() => {
    // Arrange: Set up test environment
    engine = new ContextEngine(mockIndexer, mockRetriever);
  });

  afterEach(() => {
    // Cleanup: Reset mocks and state
    vi.clearAllMocks();
  });

  describe("query()", () => {
    it("should return ranked context items for valid query", async () => {
      // Arrange
      const query = "explain this error";
      const expectedItems = 3;

      // Act
      const result = await engine.query(query);

      // Assert
      expect(result.items).toHaveLength(expectedItems);
      expect(result.items[0].score).toBeGreaterThan(result.items[1].score);
      expect(result.items).toMatchSnapshot();
    });

    it("should throw TokenBudgetExceededError when budget is negative", async () => {
      // Arrange
      const query = "test";
      const invalidBudget = -100;

      // Act & Assert
      await expect(
        engine.query(query, { tokenBudget: invalidBudget })
      ).rejects.toThrow(TokenBudgetExceededError);
    });

    it("should handle empty query gracefully", async () => {
      // Arrange
      const emptyQuery = "";

      // Act & Assert
      await expect(engine.query(emptyQuery)).rejects.toThrow(ValidationError);
    });
  });
});
```

### 2.4 Naming Conventions

**Test Suite Names:**

- Use the class/module name: `describe("ContextEngine", ...)`
- Nest method tests: `describe("query()", ...)`

**Test Case Names:**

- Use "should" format: `it("should return ranked context items for valid query", ...)`
- Be specific and descriptive
- Include the expected behavior and conditions

**Good Examples:**

```typescript
it("should return empty array when no candidates found", ...)
it("should throw ValidationError for invalid input", ...)
it("should cache results for identical queries", ...)
it("should respect token budget limits", ...)
```

**Bad Examples:**

```typescript
it("works", ...)                    // Too vague
it("test query function", ...)      // Not descriptive
it("returns data", ...)             // Missing context
```

### 2.5 Async Testing

```typescript
// ✅ GOOD: Proper async/await
it("should fetch context asynchronously", async () => {
  const result = await engine.query("test");
  expect(result).toBeDefined();
});

// ✅ GOOD: Testing promises
it("should reject with error on failure", async () => {
  await expect(engine.query("")).rejects.toThrow(ValidationError);
});

// ✅ GOOD: Testing async iterables
it("should stream tokens correctly", async () => {
  const tokens: Token[] = [];

  for await (const token of llmClient.streamChat("test")) {
    tokens.push(token);
  }

  expect(tokens.length).toBeGreaterThan(0);
});

// ❌ BAD: Missing await
it("should fetch context", () => {
  const result = engine.query("test"); // Returns Promise, not result!
  expect(result).toBeDefined(); // Will always pass
});
```

### 2.6 Mocking Strategies

#### 2.6.1 Mock External Dependencies

```typescript
import { vi } from "vitest";

// Mock module
vi.mock("@anthropic-ai/sdk", () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: "mocked response" }],
      }),
    },
  })),
}));

// Mock specific function
const mockRetrieve = vi
  .fn()
  .mockResolvedValue([{ path: "file.ts", score: 0.9 }]);

// Spy on method
const spy = vi.spyOn(engine, "query");
await engine.query("test");
expect(spy).toHaveBeenCalledWith("test");
```

#### 2.6.2 Mock VSCode API

```typescript
// Mock vscode module
vi.mock("vscode", () => ({
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
    })),
  },
  Uri: {
    file: vi.fn((path) => ({ fsPath: path })),
  },
}));
```

#### 2.6.3 Partial Mocking

```typescript
// Mock only specific methods
const partialMock = {
  ...realImplementation,
  expensiveMethod: vi.fn().mockResolvedValue("mocked"),
};
```

### 2.7 Test Fixtures

```typescript
// fixtures/sample-context.ts
export const sampleContext = {
  items: [
    {
      path: "src/core/context-engine.ts",
      score: 0.95,
      content: "export class ContextEngine {...}",
    },
    {
      path: "src/core/retriever.ts",
      score: 0.87,
      content: "export class Retriever {...}",
    },
  ],
  tokenBudget: 4000,
};

// Usage in tests
import { sampleContext } from "./fixtures/sample-context";

it("should process sample context", () => {
  const result = engine.process(sampleContext);
  expect(result).toBeDefined();
});
```

### 2.8 Snapshot Testing

```typescript
it("should generate consistent prompt structure", () => {
  const prompt = promptAssembler.build(context);

  // Snapshot test for complex objects
  expect(prompt).toMatchSnapshot();
});

// Update snapshots: pnpm test -- -u
```

**When to Use Snapshots:**

- ✅ Complex object structures (prompts, configs)
- ✅ Generated code or templates
- ✅ API response formats
- ❌ Simple values (use explicit assertions)
- ❌ Non-deterministic data (timestamps, random IDs)

### 2.9 Error Testing

```typescript
it("should throw specific error with context", () => {
  expect(() => validateInput("")).toThrow(ValidationError);
  expect(() => validateInput("")).toThrow("Input cannot be empty");
});

it("should handle async errors", async () => {
  await expect(fetchData()).rejects.toThrow(NetworkError);
  await expect(fetchData()).rejects.toMatchObject({
    code: "NETWORK_ERROR",
    message: expect.stringContaining("timeout"),
  });
});
```

---

## 3. Integration Testing

### 3.1 Integration Test Structure

```typescript
// context-engine.integration.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ContextEngine } from "../context-engine";
import { LanceDBIndexer } from "../../services/lancedb";
import { SemanticRetriever } from "../retrieval/semantic";

describe("ContextEngine Integration", () => {
  let engine: ContextEngine;
  let indexer: LanceDBIndexer;

  beforeAll(async () => {
    // Set up real dependencies (not mocks)
    indexer = new LanceDBIndexer({ path: "./test-db" });
    await indexer.initialize();

    const retriever = new SemanticRetriever(indexer);
    engine = new ContextEngine(indexer, retriever);
  });

  afterAll(async () => {
    // Clean up resources
    await indexer.close();
    await fs.rm("./test-db", { recursive: true });
  });

  it("should retrieve and rank context from real index", async () => {
    // Index test data
    await indexer.indexFiles([
      { path: "test1.ts", content: "export class Test1 {}" },
      { path: "test2.ts", content: "export class Test2 {}" },
    ]);

    // Query
    const result = await engine.query("Test1");

    // Verify
    expect(result.items).toHaveLength(2);
    expect(result.items[0].path).toBe("test1.ts");
    expect(result.items[0].score).toBeGreaterThan(result.items[1].score);
  });
});
```

### 3.2 Integration Test Scope

**Test Real Interactions:**

- ✅ Context Engine ↔ LanceDB
- ✅ Prompt Assembly ↔ Context Engine
- ✅ Extension Layer ↔ Core Engine
- ✅ Agent Runtime ↔ Tool Registry

**Still Mock:**

- ❌ External APIs (Anthropic, OpenAI)
- ❌ File system (use temp directories)
- ❌ Network requests
- ❌ VSCode API (use test harness)

---

## 4. Python Testing with pytest

### 4.1 Test File Organization

```text
scripts/
  embeddings/
    generate.py
    __tests__/
      test_generate.py           # Unit tests
      test_integration.py        # Integration tests
      conftest.py                # Shared fixtures
      fixtures/                  # Test data
        sample_embeddings.json
```

### 4.2 File Naming Conventions

- **Test files**: `test_*.py` or `*_test.py`
- **Test functions**: `test_*`
- **Test classes**: `Test*`
- **Fixtures**: `conftest.py`

### 4.3 Test Structure

```python
import pytest
from embeddings.generate import EmbeddingGenerator, ValidationError

class TestEmbeddingGenerator:
    """Test suite for EmbeddingGenerator."""

    @pytest.fixture
    def generator(self):
        """Create a generator instance for testing."""
        return EmbeddingGenerator(model="text-embedding-3-small")

    def test_generate_embeddings_success(self, generator):
        """Should generate embeddings for valid text."""
        # Arrange
        text = "def hello(): return 'world'"

        # Act
        result = generator.generate(text)

        # Assert
        assert len(result) == 1536  # Expected dimension
        assert all(isinstance(x, float) for x in result)

    def test_generate_embeddings_empty_text(self, generator):
        """Should raise ValidationError for empty text."""
        # Arrange
        empty_text = ""

        # Act & Assert
        with pytest.raises(ValidationError, match="Text cannot be empty"):
            generator.generate(empty_text)

    @pytest.mark.parametrize("text,expected_dim", [
        ("short", 1536),
        ("a" * 1000, 1536),
        ("unicode: 你好", 1536),
    ])
    def test_generate_embeddings_various_inputs(
        self, generator, text, expected_dim
    ):
        """Should handle various text inputs correctly."""
        result = generator.generate(text)
        assert len(result) == expected_dim
```

### 4.4 Fixtures

```python
# conftest.py
import pytest
from pathlib import Path

@pytest.fixture
def sample_code():
    """Provide sample code for testing."""
    return """
    def calculate(a: int, b: int) -> int:
        return a + b
    """

@pytest.fixture
def temp_output_dir(tmp_path):
    """Create temporary output directory."""
    output_dir = tmp_path / "embeddings"
    output_dir.mkdir()
    return output_dir

@pytest.fixture(scope="session")
def embedding_model():
    """Create embedding model (session-scoped for performance)."""
    from embeddings.model import load_model
    return load_model("text-embedding-3-small")
```

### 4.5 Mocking in pytest

```python
from unittest.mock import Mock, patch, MagicMock

def test_api_call_with_mock(mocker):
    """Should call API with correct parameters."""
    # Mock external API
    mock_api = mocker.patch("embeddings.api.call_embedding_api")
    mock_api.return_value = [0.1, 0.2, 0.3]

    # Test
    generator = EmbeddingGenerator()
    result = generator.generate("test")

    # Verify
    mock_api.assert_called_once_with("test", model="text-embedding-3-small")
    assert result == [0.1, 0.2, 0.3]
```

### 4.6 Parametrized Tests

```python
@pytest.mark.parametrize("input_text,expected_error", [
    ("", "Text cannot be empty"),
    (None, "Text must be a string"),
    ("a" * 10000, "Text exceeds maximum length"),
])
def test_validation_errors(generator, input_text, expected_error):
    """Should validate input and raise appropriate errors."""
    with pytest.raises(ValidationError, match=expected_error):
        generator.generate(input_text)
```

---

## 5. Coverage Requirements

### 5.1 Running Coverage

**TypeScript (Vitest):**

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Check coverage thresholds
pnpm test:coverage --reporter=text
```

**Python (pytest):**

```bash
# Generate coverage report
pytest --cov=embeddings --cov-report=html

# View HTML report
open htmlcov/index.html

# Check specific module
pytest --cov=embeddings.generate --cov-report=term-missing
```

### 5.2 Coverage Configuration

**Vitest (`vitest.config.ts`):**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/mocks/**",
        "**/fixtures/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      // Critical paths require 100%
      perFile: true,
    },
  },
});
```

**pytest (`.coveragerc` or `pyproject.toml`):**

```ini
[coverage:run]
source = embeddings
omit =
    */tests/*
    */test_*.py
    */__pycache__/*

[coverage:report]
precision = 2
show_missing = True
skip_covered = False

[coverage:html]
directory = htmlcov
```

### 5.3 Coverage Enforcement

**Pre-commit Hook:**

```bash
#!/bin/bash
# .husky/pre-commit

# Run tests with coverage
pnpm test:coverage

# Check if coverage meets threshold
if [ $? -ne 0 ]; then
  echo "❌ Tests failed or coverage below threshold"
  exit 1
fi
```

**CI/CD Pipeline:**

```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    fail_ci_if_error: true
```

---

## 6. CI/CD Integration

### 6.1 GitHub Actions Workflow

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20.x"

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test

      - name: Run integration tests
        run: pnpm test:integration

      - name: Check coverage
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt

      - name: Run pytest
        run: pytest --cov=embeddings --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 6.2 Test Execution Order

1. **Linting** - Fast feedback on code style
2. **Unit tests** - Fast, isolated tests
3. **Integration tests** - Slower, real dependencies
4. **E2E tests** - Slowest, full workflows
5. **Coverage check** - Verify thresholds

---

## 7. Best Practices

### 7.1 Test Independence

```typescript
// ✅ GOOD: Each test is independent
describe("ContextEngine", () => {
  let engine: ContextEngine;

  beforeEach(() => {
    engine = new ContextEngine(); // Fresh instance
  });

  it("test 1", () => {
    /* ... */
  });
  it("test 2", () => {
    /* ... */
  }); // Doesn't depend on test 1
});

// ❌ BAD: Tests depend on each other
describe("ContextEngine", () => {
  const engine = new ContextEngine(); // Shared instance

  it("test 1", () => {
    engine.setState("modified"); // Modifies shared state
  });

  it("test 2", () => {
    // Depends on test 1 running first!
    expect(engine.getState()).toBe("modified");
  });
});
```

### 7.2 Test Data Management

```typescript
// ✅ GOOD: Use factories or builders
function createMockContext(overrides = {}) {
  return {
    items: [],
    tokenBudget: 4000,
    ...overrides,
  };
}

it("should handle custom budget", () => {
  const context = createMockContext({ tokenBudget: 8000 });
  // ...
});

// ❌ BAD: Duplicate test data
it("test 1", () => {
  const context = { items: [], tokenBudget: 4000 };
  // ...
});

it("test 2", () => {
  const context = { items: [], tokenBudget: 4000 }; // Duplicated!
  // ...
});
```

### 7.3 Avoid Test Fragility

```typescript
// ✅ GOOD: Test behavior, not implementation
it("should return sorted items", () => {
  const result = engine.query("test");
  expect(result.items[0].score).toBeGreaterThan(result.items[1].score);
});

// ❌ BAD: Testing implementation details
it("should call sortByScore method", () => {
  const spy = vi.spyOn(engine, "sortByScore"); // Internal method
  engine.query("test");
  expect(spy).toHaveBeenCalled(); // Breaks if refactored
});
```

### 7.4 Clear Failure Messages

```typescript
// ✅ GOOD: Descriptive assertions
expect(result.items).toHaveLength(3);
expect(result.items[0]).toMatchObject({
  path: "expected.ts",
  score: expect.any(Number),
});

// ❌ BAD: Vague assertions
expect(result).toBeTruthy(); // What failed?
expect(result.items.length > 0).toBe(true); // Not clear
```

---

## 8. Common Patterns

### 8.1 Testing Async Iterables

```typescript
it("should stream tokens correctly", async () => {
  const tokens: Token[] = [];
  const stream = llmClient.streamChat("test");

  for await (const token of stream) {
    tokens.push(token);
  }

  expect(tokens).toHaveLength(5);
  expect(tokens[0]).toMatchObject({
    text: expect.any(String),
    type: "content",
  });
});
```

### 8.2 Testing Event Emitters

```typescript
it("should emit progress events", async () => {
  const events: string[] = [];

  engine.on("progress", (event) => {
    events.push(event.type);
  });

  await engine.process();

  expect(events).toEqual(["start", "indexing", "retrieving", "complete"]);
});
```

### 8.3 Testing Timers

```typescript
import { vi } from "vitest";

it("should debounce requests", async () => {
  vi.useFakeTimers();

  const spy = vi.fn();
  const debounced = debounce(spy, 1000);

  debounced();
  debounced();
  debounced();

  vi.advanceTimersByTime(1000);

  expect(spy).toHaveBeenCalledTimes(1);

  vi.useRealTimers();
});
```

---

## 9. Debugging Tests

### 9.1 Running Specific Tests

```bash
# Run single test file
pnpm test context-engine.test.ts

# Run tests matching pattern
pnpm test --grep "should return ranked"

# Run in watch mode
pnpm test:watch

# Run with debugging
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### 9.2 Debug Output

```typescript
it("should process correctly", () => {
  const result = engine.query("test");

  // Temporary debug output
  console.log("Result:", JSON.stringify(result, null, 2));

  expect(result).toBeDefined();
});
```

### 9.3 Test Isolation

```bash
# Run tests in isolation (no parallel)
pnpm test --no-threads

# Run single test
pnpm test --grep "specific test name"
```

---

## 10. Anti-Patterns to Avoid

### 10.1 Don't Test External Libraries

```typescript
// ❌ BAD: Testing Anthropic SDK
it("should call Anthropic API", async () => {
  const client = new Anthropic({ apiKey: "test" });
  const result = await client.messages.create({ ... });
  expect(result).toBeDefined(); // Testing their code!
});

// ✅ GOOD: Test your integration
it("should handle API errors gracefully", async () => {
  mockAnthropicClient.messages.create.mockRejectedValue(
    new Error("API Error")
  );

  await expect(llmClient.chat("test")).rejects.toThrow(LLMError);
});
```

### 10.2 Don't Over-Mock

```typescript
// ❌ BAD: Mocking everything
it("should process context", () => {
  const mockEngine = {
    query: vi.fn().mockResolvedValue({ items: [] }),
  };

  const result = await mockEngine.query("test");
  expect(result.items).toEqual([]); // Testing the mock!
});

// ✅ GOOD: Test real code
it("should process context", () => {
  const engine = new ContextEngine(mockIndexer, mockRetriever);
  const result = await engine.query("test");
  expect(result.items).toBeDefined();
});
```

### 10.3 Don't Test Private Methods

```typescript
// ❌ BAD: Testing private methods
it("should sort items", () => {
  const result = engine["_sortItems"](items); // Accessing private
  expect(result).toBeSorted();
});

// ✅ GOOD: Test through public API
it("should return sorted items", () => {
  const result = engine.query("test");
  expect(result.items[0].score).toBeGreaterThan(result.items[1].score);
});
```

---

## 11. Summary Checklist

Before submitting code, verify:

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage meets minimum requirements (80% for Core, 100% for critical paths)
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Test names are descriptive and use "should" format
- [ ] Async operations are tested correctly (with `async`/`await`)
- [ ] Edge cases and error conditions are tested
- [ ] Mocks are used appropriately (external dependencies only)
- [ ] Tests are independent and deterministic
- [ ] No test anti-patterns (testing libraries, over-mocking, private methods)
- [ ] Integration tests cover module interactions
- [ ] CI/CD pipeline passes

---

**Guiding Principle:**

> **Tests are documentation.
> Write tests that explain what the code does and why.**

---

**Last Updated:** 2026-01-02
**Version:** 1.0.0
