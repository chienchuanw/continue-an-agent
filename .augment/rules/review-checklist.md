# Code Review Checklist

All items MUST be verified before approval. Violations of critical items are **automatic merge blockers**.

## 1. Prompt Contract Compliance (CRITICAL)

- [ ] Prompts follow: `<SYSTEM>` → `<CONTEXT>` → `<TASK>` → `<INPUT>` → `<OUTPUT_CONSTRAINTS>`
- [ ] Context ONLY from Context Engine (never manually injected)
- [ ] Context sorted by descending score, grouped by file
- [ ] Token budget: SYSTEM (fixed), CONTEXT (40-60%), TASK (5-10%), INPUT (variable), OUTPUT (remainder)
- [ ] Hard truncation enforced (never overflow)
- [ ] No inline concatenation, no context mutation, no dynamic system prompt

## 2. Context Engine Integration (CRITICAL)

- [ ] Context Engine used for ALL non-trivial requests
- [ ] MANDATORY for: Agent tasks, Refactoring, Bug fixes, Multi-file queries
- [ ] No direct file dumping
- [ ] Intent classification performed before retrieval
- [ ] Multiple retrieval methods used (semantic, lexical, dependency, recent edits)
- [ ] Candidates ranked and scored correctly
- [ ] Token budget allocation enforced

## 3. Human-in-the-Loop Enforcement (CRITICAL)

- [ ] All file mutations require explicit user approval
- [ ] Agent explains intent BEFORE action
- [ ] No autonomous file writes
- [ ] Max step count enforced
- [ ] Extension Layer enforces ALL permission checks
- [ ] Core Engine cannot mutate state directly
- [ ] All agent tools have clear descriptions
- [ ] Tool execution requires user approval

## 4. Module Boundary Violations (MERGE BLOCKER)

**Forbidden:**

- [ ] ❌ Core → Extension
- [ ] ❌ Core → VSCode UI
- [ ] ❌ Local Services → Core
- [ ] ❌ UI → LLM APIs (direct)
- [ ] ❌ UI → File System (direct)

**Allowed:**

- [ ] ✅ VSCode UI Layer → Extension Layer types only
- [ ] ✅ Extension Layer → Core Engine public API
- [ ] ✅ Core Engine → Local Services

**Layer Responsibilities:**

- [ ] VSCode UI: Only renders, displays, collects input
- [ ] Extension Layer: Translates VSCode APIs, enforces permissions, executes actions
- [ ] Core Engine: Editor-agnostic, contains intelligence, manages LLM
- [ ] Local Services: Vector storage, embeddings, sandboxed access

## 5. Code Quality

- [ ] All code passes `tsc --noEmit` with no errors
- [ ] Strict mode enabled (`strict: true`)
- [ ] No `any` types (except with documented justification)
- [ ] No type assertions (`as`) without justification
- [ ] Explicit return types for all functions
- [ ] Naming conventions followed (Interfaces: `ILLMClient`, Types: `ContextQuery`, Classes: `PascalCase`, Functions: `camelCase`, Constants: `UPPER_SNAKE_CASE`)
- [ ] File naming: kebab-case modules, `.interface.ts`, `.type.ts`, `.constants.ts`, `.test.ts`, `.spec.ts`
- [ ] Imports organized: Node built-ins → External → Internal absolute → Relative
- [ ] ESLint shows no errors (`pnpm lint`)
- [ ] Prettier formatting applied (`pnpm format`)
- [ ] No `console.log` statements (use logger)
- [ ] Async/await used correctly (no unhandled promises)
- [ ] Error handling implemented for all async operations

## 6. Documentation

- [ ] All public APIs have TSDoc comments with `@param`, `@returns`, `@throws`, `@example`
- [ ] Comments explain WHY, not WHAT
- [ ] Non-obvious behavior is documented
- [ ] Architecture changes reflected in docs

## 7. Tests

- [ ] All tests pass (`pnpm test`)
- [ ] Minimum 80% coverage for Core Engine modules
- [ ] 100% coverage for critical paths
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Test names are descriptive
- [ ] Edge cases and error conditions are tested
- [ ] Async operations are tested correctly
- [ ] Unit tests in `**/*.test.ts`
- [ ] Integration tests in `**/*.spec.ts`
- [ ] E2E tests in `test/e2e/`

## 8. Security (CRITICAL)

- [ ] All external inputs are validated
- [ ] File paths are sanitized (no path traversal)
- [ ] No hardcoded secrets or API keys (MERGE BLOCKER)
- [ ] Environment variables used for configuration
- [ ] VSCode Secret Storage used for user secrets
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in logs or error messages
- [ ] Allowlist-based command execution only
- [ ] Timeout limits enforced

## 9. Dependencies

- [ ] Dependencies added via package manager (pnpm), not manual edits
- [ ] `package.json` changes are justified
- [ ] Lock file (`pnpm-lock.yaml`) is updated
- [ ] No unnecessary dependencies
- [ ] Security vulnerabilities checked (`pnpm audit`)

## 10. Performance

- [ ] Parallel execution used where possible (`Promise.all`)
- [ ] No unnecessary sequential operations
- [ ] Async iterables used for streams
- [ ] Expensive operations are cached
- [ ] Resources are disposed properly (`vscode.Disposable`)
- [ ] No memory leaks

## 11. Error Handling

- [ ] Domain-specific error classes are used
- [ ] Error messages are descriptive
- [ ] Error context is included
- [ ] Fail-fast with context
- [ ] Graceful degradation with logging
- [ ] Result types used for expected failures
- [ ] No swallowed errors
- [ ] Errors are logged with context

## 12. Git & Commits

- [ ] Follow conventional commits format: `<type>(<scope>): <subject>`
- [ ] Types are correct: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- [ ] Subject is clear and concise
- [ ] Body explains WHY (if needed)
- [ ] Footer references issues (`Closes #42`, `Fixes #58`)
- [ ] Branch name follows convention: `feat/<name>`, `fix/<name>`, `docs/<name>`
- [ ] PR description is clear and complete
- [ ] Related issues are linked

## 13. CI/CD Checks

All automated checks MUST pass:

- [ ] TypeScript compilation (`tsc --noEmit`)
- [ ] ESLint (`pnpm lint`)
- [ ] Prettier check (`pnpm format:check`)
- [ ] Unit tests (`pnpm test`)
- [ ] Integration tests (`pnpm test:integration`)
- [ ] Coverage threshold (80% minimum)

## 14. Merge Blockers

**AUTOMATIC MERGE BLOCKERS:**

- [ ] TypeScript compilation errors
- [ ] ESLint errors
- [ ] Test failures
- [ ] Coverage below 80% threshold
- [ ] Module boundary violations
- [ ] Hardcoded secrets
- [ ] Prompt contract violations
- [ ] Missing Context Engine integration (for non-trivial requests)
- [ ] Missing human-in-the-loop approval (for file mutations)

---

**Guiding Principle:**

> **LLMs reason. Context decides. Humans approve.**
>
> Every line of code should respect this principle.

---

**Last Updated:** 2026-01-02
**Version:** 1.0.0
