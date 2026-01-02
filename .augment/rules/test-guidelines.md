# Testing Guidelines

Testing is **mandatory** and enforced through CI/CD.

## Coverage Requirements

- Core Engine: 80% minimum, 100% critical paths
- Context Engine: 80% minimum, 100% critical paths
- Permission Checks: 100% required
- Security Gates: 100% required
- Extension Layer: 70% minimum
- UI Layer: 60% minimum

**Critical Paths (100% Required):**

- Context Engine retrieval pipeline
- Prompt assembly and token budgeting
- Permission checks and security gates
- Error handling and recovery
- Input validation and sanitization

## TypeScript Testing (Vitest)

**File Organization:**

- Unit tests: `*.test.ts`
- Integration tests: `*.spec.ts`
- E2E tests: `*.e2e.ts` in `test/e2e/`
- Test fixtures: `fixtures/`
- Mocks: `mocks/mock-*.ts`

**Test Structure (Arrange-Act-Assert):**

```typescript
describe("ContextEngine", () => {
  it("should return ranked context items", async () => {
    const result = await engine.query(query);
    expect(result.items).toHaveLength(3);
  });
});
```

**Test Naming:** Use "should" format, be specific and descriptive

**Async Testing:**

- Always use `async/await`
- Test promise rejections with `rejects.toThrow()`
- Test async iterables with `for await...of`

**Mocking:**

- Mock external dependencies with `vi.mock()`
- Mock specific functions with `vi.fn()`
- Spy on methods with `vi.spyOn()`

**Error Testing:**

- Test specific error types with `toThrow(ErrorClass)`
- Test async errors with `rejects.toThrow()`

## Integration Testing

**Test Real Interactions:**

- Context Engine ↔ LanceDB
- Prompt Assembly ↔ Context Engine
- Extension Layer ↔ Core Engine

**Still Mock:**

- External APIs (Anthropic, OpenAI)
- File system (use temp directories)
- Network requests
- VSCode API (use test harness)

## Python Testing (pytest)

**File Organization:**

- Test files: `test_*.py` or `*_test.py`
- Fixtures: `conftest.py`

**Test Structure:**

- Use Arrange-Act-Assert pattern
- Use `@pytest.fixture` for setup
- Use `@pytest.mark.parametrize` for multiple inputs

**Mocking:**

- Use `mocker.patch()` for external APIs
- Mock external APIs, file system, network requests

## Running Tests

**TypeScript:**

```bash
pnpm test                    # Run all tests
pnpm test:coverage           # Generate coverage report
pnpm test context-engine.test.ts  # Run single file
pnpm test --grep "pattern"   # Run tests matching pattern
```

**Python:**

```bash
pytest --cov=embeddings --cov-report=html
```

## Best Practices

- Test behavior, not implementation
- Each test is independent with fresh setup
- Use factories or builders to avoid duplication
- Use descriptive assertions
- Don't test external libraries
- Don't over-mock
- Don't test private methods

## Summary Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage meets minimum requirements
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Test names are descriptive
- [ ] Async operations tested correctly
- [ ] Edge cases and error conditions tested
- [ ] Mocks used appropriately
- [ ] Tests are independent and deterministic
- [ ] Integration tests cover module interactions

---

**Guiding Principle:**

> **Tests are documentation.
> Write tests that explain what the code does and why.**

---

**Last Updated:** 2026-01-02
**Version:** 1.0.0
