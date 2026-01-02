# Development Workflow

## agent-naan × Continue.dev × Claude 4.5

This document defines the **complete development workflow** for the project, including Git Flow branching strategy, commit conventions, PR guidelines, CI/CD requirements, semantic versioning, and deployment processes.

**Note:** This is a **single-developer project** with streamlined workflows. No approval is required for PRs, but all automated checks must pass.

---

## 1. Git Flow Branching Strategy

### 1.1 Branch Types

```text
main
  ├── feat/<feature-name>      # New features
  ├── fix/<bug-name>           # Bug fixes
  ├── docs/<doc-name>          # Documentation updates
  ├── refactor/<scope>         # Code refactoring
  ├── perf/<optimization>      # Performance improvements
  ├── test/<test-name>         # Test additions/updates
  └── chore/<task-name>        # Build, dependencies, tooling
```

### 1.2 Branch Naming Conventions

**Format:** `<type>/<short-description>`

**Rules:**

- Use lowercase with hyphens (kebab-case)
- Keep descriptions concise (2-4 words)
- Be descriptive but brief

**Examples:**

```bash
feat/context-engine-v1
feat/semantic-retrieval
fix/token-budget-overflow
fix/prompt-assembly-bug
docs/architecture-update
docs/api-reference
refactor/llm-abstraction
refactor/module-boundaries
perf/indexing-optimization
perf/cache-strategy
test/context-engine-coverage
test/integration-suite
chore/update-dependencies
chore/ci-pipeline
```

### 1.3 Main Branch Protection

**`main` branch rules:**

- ✅ Always deployable
- ✅ All CI checks must pass
- ✅ Must have passing tests
- ✅ Must meet coverage requirements (80% minimum)
- ❌ No direct commits (use feature branches)
- ❌ No force pushes

### 1.4 Branch Lifecycle

```text
1. Create branch from main
   git checkout main
   git pull origin main
   git checkout -b feat/new-feature

2. Develop and commit
   # Make changes
   git add .
   git commit -m "feat(scope): description"

3. Push to remote
   git push origin feat/new-feature

4. Create Pull Request
   # Via GitHub UI or CLI

5. CI checks run automatically
   # Linting, tests, coverage

6. Merge to main (single developer - no approval needed)
   # Via GitHub UI or CLI

7. Delete feature branch
   git branch -d feat/new-feature
   git push origin --delete feat/new-feature
```

---

## 2. Commit Conventions

### 2.1 Commit Message Format

**Structure:**

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Components:**

- **type**: Category of change (required)
- **scope**: Module or component affected (optional but recommended)
- **subject**: Brief description (required, max 72 characters)
- **body**: Detailed explanation (optional)
- **footer**: Issue references, breaking changes (optional)

### 2.2 Commit Types

| Type       | Description                                     | Example                                     |
| ---------- | ----------------------------------------------- | ------------------------------------------- |
| `feat`     | New feature                                     | `feat(context): add semantic retrieval`     |
| `fix`      | Bug fix                                         | `fix(prompt): prevent token overflow`       |
| `docs`     | Documentation only                              | `docs(readme): update setup instructions`   |
| `style`    | Code style (formatting, no logic change)        | `style(core): apply prettier formatting`    |
| `refactor` | Code refactoring (no feature change or bug fix) | `refactor(llm): extract provider registry`  |
| `perf`     | Performance improvement                         | `perf(indexing): optimize batch processing` |
| `test`     | Adding or updating tests                        | `test(context): add integration tests`      |
| `chore`    | Build process, dependencies, tooling            | `chore(deps): update anthropic sdk`         |
| `ci`       | CI/CD configuration changes                     | `ci(github): add coverage reporting`        |
| `revert`   | Revert a previous commit                        | `revert: feat(context): add semantic...`    |

### 2.3 Scope Guidelines

**Common scopes:**

- `context` - Context Engine
- `prompt` - Prompt Assembly
- `llm` - LLM Abstraction Layer
- `agent` - Agent Runtime
- `extension` - VSCode Extension Layer
- `ui` - UI Components
- `core` - Core Engine
- `services` - Local Services
- `deps` - Dependencies
- `config` - Configuration
- `docs` - Documentation

### 2.4 Subject Line Rules

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters
- Be specific and descriptive

**Good Examples:**

```text
feat(context): implement semantic retrieval with LanceDB
fix(prompt): prevent token budget overflow in packer
docs(architecture): clarify module boundary rules
refactor(llm): extract provider registry pattern
test(context): add integration tests for retrieval pipeline
```

**Bad Examples:**

```text
feat: stuff                           # Too vague
fix: Fixed a bug                      # Not imperative, capitalized
docs: Updated documentation.          # Has period, not specific
refactor: Refactored some code        # Not imperative, too vague
```

### 2.5 Body Guidelines

**When to include a body:**

- Complex changes requiring explanation
- Non-obvious implementation decisions
- Breaking changes
- Multiple related changes

**Format:**

- Wrap at 72 characters
- Explain **why**, not **what** (code shows what)
- Use bullet points for multiple items
- Separate from subject with blank line

**Example:**

```text
feat(context): implement semantic retrieval

- Add LanceDB integration for vector search
- Implement chunking at function/class level
- Add background indexing on file save

The semantic retrieval uses embeddings to find relevant code
based on meaning rather than exact keyword matches. This
significantly improves context quality for error explanations
and refactoring tasks.
```

### 2.6 Footer Guidelines

**Issue References:**

```text
Closes #42
Fixes #58
Resolves #123
Relates to #456
```

**Breaking Changes:**

```text
BREAKING CHANGE: Context Engine API now requires token budget parameter

Migration guide:
- Old: engine.query(query)
- New: engine.query(query, { tokenBudget: 4000 })
```

### 2.7 Complete Examples

**Simple Feature:**

```text
feat(context): add lexical search fallback

When semantic search returns no results, fall back to
lexical search for exact identifier matches.

Closes #42
```

**Bug Fix:**

```text
fix(prompt): prevent token budget overflow

The prompt packer was not accounting for system prompt tokens,
causing budget overruns. Now includes all sections in calculation.

Fixes #58
```

**Documentation:**

```text
docs(architecture): clarify module boundary rules

Add explicit examples of allowed/forbidden dependencies
between layers to prevent violations.
```

**Refactoring:**

```text
refactor(llm): extract provider registry pattern

- Create ProviderRegistry class
- Move provider registration logic
- Add provider discovery mechanism

This makes it easier to add new LLM providers without
modifying core engine code.
```

**Breaking Change:**

```text
feat(context): add mandatory token budgeting

BREAKING CHANGE: All Context Engine queries now require
explicit token budget parameter.

Migration:
- Before: engine.query(query)
- After: engine.query(query, { tokenBudget: 4000 })

Closes #123
```

---

## 3. Pull Request Guidelines

### 3.1 PR Creation Process

**Single Developer Workflow:**

1. Create feature branch
2. Implement changes
3. Run all checks locally
4. Push to remote
5. Create PR (self-review)
6. Wait for CI to pass
7. Merge (no approval needed)
8. Delete branch

### 3.2 PR Title Format

Use the same format as commit messages:

```text
<type>(<scope>): <description>
```

**Examples:**

```text
feat(context): implement semantic retrieval
fix(prompt): prevent token budget overflow
docs(readme): update installation instructions
```

### 3.3 PR Description Template

```markdown
## Description

Brief summary of changes and motivation.

## Type of Change

- [ ] New feature (feat)
- [ ] Bug fix (fix)
- [ ] Documentation (docs)
- [ ] Code refactoring (refactor)
- [ ] Performance improvement (perf)
- [ ] Test addition/update (test)
- [ ] Build/dependency update (chore)

## Changes Made

- Bullet point list of specific changes
- Include file/module names
- Highlight important decisions

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally
- [ ] Coverage meets requirements (80% minimum)

## Checklist

- [ ] Code follows coding standards
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No hardcoded secrets
- [ ] Module boundaries respected

## Related Issues

Closes #42
Relates to #58

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Additional Notes

[Any additional context or notes]
```

### 3.4 Self-Review Checklist

Before merging, verify:

**Code Quality:**

- [ ] Follows coding standards
- [ ] No `any` types without justification
- [ ] No `console.log` statements
- [ ] Proper error handling
- [ ] TSDoc comments for public APIs

**Architecture:**

- [ ] Module boundaries respected
- [ ] No forbidden dependencies
- [ ] Context Engine used where required
- [ ] Human-in-the-loop for mutations

**Testing:**

- [ ] All tests pass
- [ ] Coverage meets requirements
- [ ] Edge cases tested
- [ ] Integration tests for module interactions

**Documentation:**

- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] Architecture docs updated (if needed)
- [ ] Inline comments explain WHY

**CI/CD:**

- [ ] All automated checks pass
- [ ] No merge conflicts
- [ ] Branch is up to date with main

### 3.5 Merge Strategy

#### Preferred: Squash and Merge

- Keeps main branch history clean
- Combines all commits into one
- Use meaningful squash commit message

#### When to use Merge Commit

- Large features with meaningful commit history
- Want to preserve individual commits
- Multiple logical changes

#### Never use Rebase and Merge

- Can cause issues with single-developer workflow
- Harder to track in history

---

## 4. CI/CD Requirements

### 4.1 Automated Checks

All PRs must pass these checks before merge:

#### 1. Linting (ESLint)

```bash
pnpm lint
```

- No errors allowed
- Warnings are acceptable but should be minimized

#### 2. Type Checking (TypeScript)

```bash
tsc --noEmit
```

- Must compile without errors
- Strict mode enabled

#### 3. Formatting (Prettier)

```bash
pnpm format:check
```

- All files must be formatted
- Run `pnpm format` to auto-fix

#### 4. Unit Tests (Vitest)

```bash
pnpm test
```

- All tests must pass
- No skipped tests in main branch

#### 5. Integration Tests

```bash
pnpm test:integration
```

- All integration tests must pass
- Real dependencies tested

#### 6. Coverage Check

```bash
pnpm test:coverage
```

- Minimum 80% coverage for Core Engine
- 100% coverage for critical paths
- Coverage report uploaded to Codecov

#### 7. Build Verification

```bash
pnpm build
```

- Production build must succeed
- No build warnings

### 4.2 GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20.x"
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20.x"
      - run: npm install -g pnpm
      - run: pnpm install
      - run: tsc --noEmit

  format:
    name: Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20.x"
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm format:check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20.x"
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:integration

  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20.x"
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20.x"
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm build
```

### 4.3 Pre-commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Run linter
echo "📝 Linting..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Run type check
echo "🔧 Type checking..."
tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# Run formatter
echo "✨ Formatting..."
pnpm format
git add -u

# Run tests
echo "🧪 Testing..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "✅ All pre-commit checks passed"
```

### 4.4 CI Failure Handling

#### If CI fails

1. Check the failed job in GitHub Actions
2. Reproduce the failure locally
3. Fix the issue
4. Commit the fix
5. Push to the same branch
6. CI will re-run automatically

#### Common failures

- **Linting errors**: Run `pnpm lint:fix`
- **Type errors**: Fix TypeScript issues
- **Test failures**: Debug and fix tests
- **Coverage below threshold**: Add more tests
- **Build errors**: Check for missing dependencies

---

## 5. Semantic Versioning

### 5.1 Version Format

**Format:** `MAJOR.MINOR.PATCH`

**Example:** `1.2.3`

- `1` = Major version
- `2` = Minor version
- `3` = Patch version

### 5.2 Version Increment Rules

#### MAJOR version (1.0.0 → 2.0.0)

- Breaking changes
- Incompatible API changes
- Major architectural changes

#### MINOR version (1.0.0 → 1.1.0)

- New features (backward compatible)
- New functionality
- Deprecations (with backward compatibility)

#### PATCH version (1.0.0 → 1.0.1)

- Bug fixes
- Performance improvements
- Documentation updates
- Internal refactoring (no API changes)

### 5.3 Pre-release Versions

#### Format

`MAJOR.MINOR.PATCH-<pre-release>`

#### Examples

- `1.0.0-alpha.1` - Alpha release
- `1.0.0-beta.2` - Beta release
- `1.0.0-rc.1` - Release candidate

#### Pre-release stages

1. **alpha** - Early development, unstable
2. **beta** - Feature complete, testing
3. **rc** - Release candidate, final testing

### 5.4 Version Tagging

#### Create a version tag

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Push tag to remote
git push origin main --tags
```

#### Tag naming

- Use `v` prefix: `v1.0.0`
- Follow semantic versioning
- Include in release notes

---

## 6. Release Process

### 6.1 Release Checklist

**Pre-release:**

- [ ] All tests pass
- [ ] Coverage meets requirements
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] No known critical bugs

**Release:**

- [ ] Create release branch (if needed)
- [ ] Run full test suite
- [ ] Build production bundle
- [ ] Create GitHub release
- [ ] Publish to VSCode Marketplace (when ready)
- [ ] Update documentation site (when ready)

**Post-release:**

- [ ] Monitor for issues
- [ ] Update roadmap
- [ ] Plan next release

### 6.2 Release Branch Strategy

**For major/minor releases:**

```bash
# Create release branch
git checkout -b release/v1.2.0

# Finalize changes
# Update version, changelog, docs

# Merge to main
git checkout main
git merge release/v1.2.0

# Tag release
git tag v1.2.0
git push origin main --tags

# Delete release branch
git branch -d release/v1.2.0
```

**For patch releases:**

```bash
# Work directly on main or hotfix branch
git checkout -b hotfix/critical-bug

# Fix bug
# Update version (patch)

# Merge to main
git checkout main
git merge hotfix/critical-bug

# Tag release
git tag v1.0.1
git push origin main --tags
```

### 6.3 CHANGELOG Format

**File:** `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New features in development

### Changed

- Changes to existing functionality

### Deprecated

- Soon-to-be removed features

### Removed

- Removed features

### Fixed

- Bug fixes

### Security

- Security fixes

## [1.2.0] - 2026-01-15

### Added

- Context Engine semantic retrieval
- LanceDB integration for vector search
- Background indexing on file save

### Changed

- Improved prompt assembly token budgeting
- Updated Context Engine API

### Fixed

- Token budget overflow in prompt packer
- Race condition in indexer

## [1.1.0] - 2026-01-01

### Added

- Claude Sonnet 4.5 support
- Inline completion provider
- Chat sidebar UI

### Fixed

- API key storage issues
- Streaming response bugs

## [1.0.0] - 2025-12-15

### Added

- Initial release
- Basic Claude integration
- VSCode extension framework
```

### 6.4 GitHub Release Creation

**Via GitHub UI:**

1. Go to repository → Releases
2. Click "Draft a new release"
3. Choose tag (or create new)
4. Fill in release title: `v1.2.0 - Feature Name`
5. Copy relevant CHANGELOG section
6. Attach build artifacts (if any)
7. Mark as pre-release (if applicable)
8. Publish release

**Via GitHub CLI:**

```bash
gh release create v1.2.0 \
  --title "v1.2.0 - Context Engine v1" \
  --notes-file RELEASE_NOTES.md \
  ./dist/agent-naan-1.2.0.vsix
```

---

## 7. Deployment Workflow

### 7.1 Development Deployment

**Local Development:**

```bash
# Watch mode
pnpm watch

# Launch extension
# Press F5 in VSCode
```

**Testing in Extension Development Host:**

1. Open project in VSCode
2. Press `F5` or Run → Start Debugging
3. New VSCode window opens with extension loaded
4. Test features in Extension Development Host

### 7.2 Production Build

**Build for production:**

```bash
# Clean previous builds
rm -rf dist/

# Build production bundle
pnpm build:prod

# Package as .vsix
pnpm package
```

**Output:**

- `dist/` - Compiled JavaScript
- `agent-naan-<version>.vsix` - VSCode extension package

### 7.3 VSCode Marketplace Deployment

**Prerequisites:**

- VSCode Marketplace publisher account
- Personal Access Token (PAT)
- Extension manifest (`package.json`) configured

**Publish to Marketplace:**

```bash
# Install vsce (VSCode Extension Manager)
npm install -g @vscode/vsce

# Login to publisher
vsce login <publisher-name>

# Publish extension
vsce publish

# Or publish specific version
vsce publish 1.2.0

# Or publish from .vsix file
vsce publish agent-naan-1.2.0.vsix
```

**Marketplace URL:**

```text
https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>
```

### 7.4 Manual Installation

**Install from .vsix file:**

```bash
# Via command line
code --install-extension agent-naan-1.2.0.vsix

# Via VSCode UI
# Extensions → ... → Install from VSIX
```

### 7.5 Deployment Checklist

**Before deployment:**

- [ ] All CI checks pass
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] README updated
- [ ] Build succeeds
- [ ] Extension tested locally
- [ ] No hardcoded secrets
- [ ] License file included

**After deployment:**

- [ ] Verify installation works
- [ ] Test core features
- [ ] Monitor for issues
- [ ] Update documentation
- [ ] Announce release

---

## 8. Hotfix Workflow

### 8.1 Critical Bug Fix Process

**When a critical bug is found in production:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-name

# 2. Fix the bug
# Make minimal changes to fix the issue

# 3. Test thoroughly
pnpm test
pnpm test:integration

# 4. Update version (patch)
npm version patch

# 5. Update CHANGELOG
# Add entry under [Unreleased] or new patch version

# 6. Commit
git add .
git commit -m "fix(scope): critical bug description"

# 7. Push and create PR
git push origin hotfix/critical-bug-name

# 8. Merge to main (after CI passes)
git checkout main
git merge hotfix/critical-bug-name

# 9. Tag and release
git tag v1.0.1
git push origin main --tags

# 10. Deploy immediately
pnpm build:prod
pnpm package
vsce publish

# 11. Delete hotfix branch
git branch -d hotfix/critical-bug-name
git push origin --delete hotfix/critical-bug-name
```

### 8.2 Hotfix Criteria

**Create a hotfix for:**

- ✅ Critical bugs affecting all users
- ✅ Security vulnerabilities
- ✅ Data loss issues
- ✅ Extension crashes
- ✅ Breaking functionality

**Don't create hotfix for:**

- ❌ Minor bugs
- ❌ Feature requests
- ❌ Performance improvements
- ❌ Documentation updates
- ❌ Non-critical issues

---

## 9. Workflow Summary

### 9.1 Daily Development Workflow

```bash
# 1. Start of day - sync with main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/new-feature

# 3. Develop
# Make changes, write tests, update docs

# 4. Commit frequently
git add .
git commit -m "feat(scope): description"

# 5. Push to remote
git push origin feat/new-feature

# 6. Create PR (when ready)
# Via GitHub UI

# 7. Wait for CI
# All checks must pass

# 8. Merge to main
# Via GitHub UI (squash and merge)

# 9. Delete branch
git branch -d feat/new-feature
git push origin --delete feat/new-feature

# 10. Sync main
git checkout main
git pull origin main
```

### 9.2 Release Workflow

```bash
# 1. Prepare release
# Update CHANGELOG, version, docs

# 2. Create release commit
git add .
git commit -m "chore(release): prepare v1.2.0"

# 3. Tag release
git tag v1.2.0

# 4. Push to remote
git push origin main --tags

# 5. Build and package
pnpm build:prod
pnpm package

# 6. Create GitHub release
gh release create v1.2.0 \
  --title "v1.2.0 - Feature Name" \
  --notes-file RELEASE_NOTES.md \
  ./dist/agent-naan-1.2.0.vsix

# 7. Publish to Marketplace (when ready)
vsce publish
```

---

## 10. Best Practices

### 10.1 Commit Best Practices

- ✅ Commit early and often
- ✅ Keep commits focused and atomic
- ✅ Write meaningful commit messages
- ✅ Test before committing
- ✅ Don't commit broken code
- ❌ Don't commit commented-out code
- ❌ Don't commit console.log statements
- ❌ Don't commit secrets or credentials

### 10.2 Branch Best Practices

- ✅ Keep branches short-lived (< 1 week)
- ✅ Sync with main frequently
- ✅ Delete merged branches
- ✅ Use descriptive branch names
- ❌ Don't work on main directly
- ❌ Don't create long-lived feature branches
- ❌ Don't let branches get stale

### 10.3 PR Best Practices

- ✅ Keep PRs small and focused
- ✅ Write clear PR descriptions
- ✅ Self-review before creating PR
- ✅ Ensure CI passes before merging
- ✅ Update documentation
- ❌ Don't create massive PRs
- ❌ Don't merge failing PRs
- ❌ Don't skip self-review

### 10.4 Release Best Practices

- ✅ Follow semantic versioning
- ✅ Update CHANGELOG for every release
- ✅ Test thoroughly before releasing
- ✅ Create GitHub releases
- ✅ Monitor post-release
- ❌ Don't release untested code
- ❌ Don't skip version bumps
- ❌ Don't forget to tag releases

---

## 11. Troubleshooting

### 11.1 Common Issues

#### Issue: CI fails but passes locally

```bash
# Clear local cache
rm -rf node_modules dist coverage
pnpm install
pnpm test

# Check Node version matches CI
node --version  # Should be 20.x
```

#### Issue: Merge conflicts

```bash
# Update branch with main
git checkout feat/my-feature
git fetch origin
git rebase origin/main

# Resolve conflicts
# Edit conflicted files
git add .
git rebase --continue

# Force push (if already pushed)
git push origin feat/my-feature --force-with-lease
```

#### Issue: Failed to push tags

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Recreate tag
git tag v1.0.0
git push origin v1.0.0
```

#### Issue: Pre-commit hook fails

```bash
# Skip pre-commit hook (use sparingly)
git commit --no-verify -m "message"

# Or fix the issues
pnpm lint:fix
pnpm format
pnpm test
```

### 11.2 Getting Help

- Check existing documentation
- Review `.augment/rules/` guidelines
- Search GitHub issues
- Check CI logs for details

---

**Guiding Principle:**

> **Ship early, ship often.
> Automate everything.
> Trust the process.**

---

**Last Updated:** 2026-01-02
**Version:** 1.0.0
