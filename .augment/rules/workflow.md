# Development Workflow

Single-developer project with streamlined workflows. No approval required for PRs, but all automated checks must pass.

## 1. Git Flow Branching Strategy

**Branch Types:**

- `feat/<feature-name>` - New features
- `fix/<bug-name>` - Bug fixes
- `docs/<doc-name>` - Documentation updates
- `refactor/<scope>` - Code refactoring
- `perf/<optimization>` - Performance improvements
- `test/<test-name>` - Test additions/updates
- `chore/<task-name>` - Build, dependencies, tooling

**Branch Naming:**

- Use lowercase with hyphens (kebab-case)
- Keep descriptions concise (2-4 words)
- Example: `feat/context-engine-v1`, `fix/token-budget-overflow`

**Main Branch Rules:**

- ✅ Always deployable
- ✅ All CI checks must pass
- ✅ Must have passing tests
- ✅ Must meet coverage requirements (80% minimum)
- ❌ No direct commits (use feature branches)
- ❌ No force pushes

**Branch Lifecycle:**

1. Create branch from main: `git checkout -b feat/new-feature`
2. Develop and commit: `git commit -m "feat(scope): description"`
3. Push to remote: `git push origin feat/new-feature`
4. Create Pull Request via GitHub UI
5. CI checks run automatically
6. Merge to main (no approval needed)
7. Delete feature branch

---

## 2. Commit Conventions

**Format:**

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, tooling

**Subject Line Rules:**

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters
- Be specific and descriptive

**Body Guidelines:**

- Explain **why**, not **what** (code shows what)
- Use bullet points for multiple items
- Separate from subject with blank line

**Footer:**

- Issue references: `Closes #42`, `Fixes #58`
- Breaking changes: `BREAKING CHANGE: description`

**Examples:**

```text
feat(context): implement semantic retrieval

- Add LanceDB integration for vector search
- Implement chunking at function/class level
- Add background indexing on file save

Closes #42

---

fix(prompt): prevent token budget overflow

The prompt packer was not accounting for system prompt tokens,
causing budget overruns. Now includes all sections in calculation.

Fixes #58
```

---

## 3. Pull Request Guidelines

**PR Creation Process:**

1. Create feature branch
2. Implement changes
3. Run all checks locally
4. Push to remote
5. Create PR (self-review)
6. Wait for CI to pass
7. Merge (no approval needed)
8. Delete branch

**PR Title Format:**
Use the same format as commit messages: `<type>(<scope>): <description>`

**Self-Review Checklist:**

- [ ] Code follows coding standards
- [ ] No `any` types without justification
- [ ] No `console.log` statements
- [ ] Proper error handling
- [ ] TSDoc comments for public APIs
- [ ] Module boundaries respected
- [ ] No forbidden dependencies
- [ ] Context Engine used where required
- [ ] All tests pass
- [ ] Coverage meets requirements (80% minimum)
- [ ] Documentation updated
- [ ] No hardcoded secrets
- [ ] All automated checks pass

**Merge Strategy:**

- Preferred: Squash and Merge (keeps main branch history clean)
- Use meaningful squash commit message

---

## 4. CI/CD Requirements

**Automated Checks (all must pass before merge):**

1. **Linting (ESLint)**: `pnpm lint` - No errors allowed
2. **Type Checking (TypeScript)**: `tsc --noEmit` - Must compile without errors
3. **Formatting (Prettier)**: `pnpm format:check` - All files must be formatted
4. **Unit Tests (Vitest)**: `pnpm test` - All tests must pass
5. **Integration Tests**: `pnpm test:integration` - All integration tests must pass
6. **Coverage Check**: `pnpm test:coverage` - Minimum 80% coverage, 100% for critical paths
7. **Build Verification**: `pnpm build` - Production build must succeed

**Pre-commit Hooks:**

- Run linter: `pnpm lint`
- Run type check: `tsc --noEmit`
- Run formatter: `pnpm format`
- Run tests: `pnpm test`

**CI Failure Handling:**

1. Check the failed job in GitHub Actions
2. Reproduce the failure locally
3. Fix the issue
4. Commit the fix
5. Push to the same branch
6. CI will re-run automatically

**Common failures:**

- **Linting errors**: Run `pnpm lint:fix`
- **Type errors**: Fix TypeScript issues
- **Test failures**: Debug and fix tests
- **Coverage below threshold**: Add more tests
- **Build errors**: Check for missing dependencies

---

## 5. Semantic Versioning

**Format:** `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

**Version Increment Rules:**

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, incompatible API changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, performance improvements, documentation

**Pre-release Versions:**

- `1.0.0-alpha.1` - Alpha release (early development, unstable)
- `1.0.0-beta.2` - Beta release (feature complete, testing)
- `1.0.0-rc.1` - Release candidate (final testing)

**Version Tagging:**

```bash
npm version patch  # or minor, or major
git push origin main --tags
```

Use `v` prefix: `v1.0.0`

---

## 6. Release Process

**Release Checklist:**

- [ ] All tests pass
- [ ] Coverage meets requirements
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] No known critical bugs
- [ ] Run full test suite
- [ ] Build production bundle
- [ ] Create GitHub release

**Release Branch Strategy:**

For major/minor releases:

```bash
git checkout -b release/v1.2.0
# Update version, changelog, docs
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags
```

For patch releases:

```bash
git checkout -b hotfix/critical-bug
# Fix bug, update version
git checkout main
git merge hotfix/critical-bug
git tag v1.0.1
git push origin main --tags
```

**CHANGELOG Format:**
Use [Keep a Changelog](https://keepachangelog.com/) format with sections: Added, Changed, Deprecated, Removed, Fixed, Security

**GitHub Release Creation:**

1. Go to repository → Releases
2. Click "Draft a new release"
3. Choose tag (or create new)
4. Fill in release title: `v1.2.0 - Feature Name`
5. Copy relevant CHANGELOG section
6. Publish release

---

## 7. Deployment Workflow

**Local Development:**

```bash
pnpm watch          # Watch mode
# Press F5 in VSCode to launch extension
```

**Production Build:**

```bash
rm -rf dist/        # Clean previous builds
pnpm build:prod     # Build production bundle
pnpm package        # Package as .vsix
```

**VSCode Marketplace Deployment:**

```bash
npm install -g @vscode/vsce
vsce login <publisher-name>
vsce publish        # or vsce publish 1.2.0
```

**Manual Installation:**

```bash
code --install-extension agent-naan-1.2.0.vsix
```

**Deployment Checklist:**

- [ ] All CI checks pass
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Build succeeds
- [ ] Extension tested locally
- [ ] No hardcoded secrets
- [ ] Verify installation works
- [ ] Test core features

---

## 8. Hotfix Workflow

**Critical Bug Fix Process:**

1. Create hotfix branch: `git checkout -b hotfix/critical-bug-name`
2. Fix the bug (minimal changes)
3. Test thoroughly: `pnpm test && pnpm test:integration`
4. Update version: `npm version patch`
5. Update CHANGELOG
6. Commit: `git commit -m "fix(scope): critical bug description"`
7. Push and create PR
8. Merge to main (after CI passes)
9. Tag and release: `git tag v1.0.1 && git push origin main --tags`
10. Deploy immediately: `pnpm build:prod && pnpm package && vsce publish`
11. Delete hotfix branch

**Hotfix Criteria:**

- ✅ Critical bugs affecting all users
- ✅ Security vulnerabilities
- ✅ Data loss issues
- ✅ Extension crashes
- ❌ Minor bugs, feature requests, documentation updates

---

## 9. Workflow Summary

**Daily Development:**

1. Sync with main: `git checkout main && git pull origin main`
2. Create feature branch: `git checkout -b feat/new-feature`
3. Develop (make changes, write tests, update docs)
4. Commit frequently: `git commit -m "feat(scope): description"`
5. Push to remote: `git push origin feat/new-feature`
6. Create PR via GitHub UI
7. Wait for CI (all checks must pass)
8. Merge to main (squash and merge)
9. Delete branch: `git branch -d feat/new-feature`
10. Sync main: `git checkout main && git pull origin main`

**Release Workflow:**

1. Prepare release (update CHANGELOG, version, docs)
2. Create release commit: `git commit -m "chore(release): prepare v1.2.0"`
3. Tag release: `git tag v1.2.0`
4. Push to remote: `git push origin main --tags`
5. Build and package: `pnpm build:prod && pnpm package`
6. Create GitHub release
7. Publish to Marketplace: `vsce publish`

---

## 10. Best Practices

**Commit Best Practices:**

- ✅ Commit early and often
- ✅ Keep commits focused and atomic
- ✅ Write meaningful commit messages
- ✅ Test before committing
- ❌ Don't commit broken code, secrets, or console.log statements

**Branch Best Practices:**

- ✅ Keep branches short-lived (< 1 week)
- ✅ Sync with main frequently
- ✅ Delete merged branches
- ❌ Don't work on main directly
- ❌ Don't create long-lived feature branches

**PR Best Practices:**

- ✅ Keep PRs small and focused
- ✅ Write clear PR descriptions
- ✅ Self-review before creating PR
- ✅ Ensure CI passes before merging
- ❌ Don't create massive PRs
- ❌ Don't merge failing PRs

**Release Best Practices:**

- ✅ Follow semantic versioning
- ✅ Update CHANGELOG for every release
- ✅ Test thoroughly before releasing
- ✅ Create GitHub releases
- ❌ Don't release untested code
- ❌ Don't skip version bumps

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
