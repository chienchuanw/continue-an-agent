# Project Guidelines

## agent-naan × Continue.dev × Claude 4.5

This document provides a comprehensive overview of the **agent-naan** project, including its purpose, architecture, technology stack, development workflow, and setup instructions.

---

## 1. Project Overview

### 1.1 What is agent-naan?

**agent-naan** is a VSCode-native AI assistant built on a Continue.dev fork with Claude 4.5 as the primary LLM. The project aims to **match or exceed Augment Code** in:

- **Context relevance** - Intelligent, intent-aware context retrieval
- **Suggestion precision** - High-quality code completions and explanations
- **Non-intrusive UX** - IDE-native integration without disrupting workflow

### 1.2 Core Differentiator: The Context Engine

The **Context Engine** is the heart of the system. It answers one critical question:

> **"What information should the model see, and why?"**

Unlike traditional AI assistants that dump entire files or use brute-force long-context loading, agent-naan uses:

- **Intent classification** - Understanding what the user is trying to accomplish
- **Semantic retrieval** - Finding relevant code based on meaning, not just keywords
- **Token budget allocation** - Intelligent context packing within model limits
- **Deterministic prompt assembly** - Reproducible, predictable behavior

### 1.3 Project Goals

✅ **Primary Goals:**

- Build a VSCode-native AI assistant with Claude 4.5 (Haiku/Sonnet/Opus)
- Implement a first-class Context Engine (multi-file, semantic, intent-aware)
- Provide high-trust, human-in-the-loop agent tools
- Create a modular, model-agnostic, long-term maintainable architecture

❌ **Explicit Non-Goals:**

- Not a GitHub Copilot clone
- Not a fully autonomous "Cline-style" agent
- Not a chat-only wrapper around LLM APIs

### 1.4 Project Status

This is an **early-stage project** with:

- ✅ Comprehensive architectural documentation
- ✅ Clear module boundaries and specifications
- ⏳ Minimal implementation (Phase 0 - Foundation)

---

## 2. Technology Stack

### 2.1 Primary Technologies

| Technology        | Purpose                            | Version      |
| ----------------- | ---------------------------------- | ------------ |
| **TypeScript**    | Primary language for all new code  | Latest       |
| **Node.js**       | Runtime for Core Engine            | 18.x or 20.x |
| **pnpm**          | Package manager (monorepo support) | 8.x+         |
| **VSCode API**    | Extension host and UI integration  | Latest       |
| **Vitest**        | Unit and integration testing       | Latest       |
| **ESLint**        | Code quality and style enforcement | Latest       |
| **Prettier**      | Code formatting                    | Latest       |
| **LanceDB**       | Vector database for embeddings     | Latest       |
| **Anthropic SDK** | Claude API client                  | Latest       |

### 2.2 Secondary Technologies

| Technology | Purpose                          | Version |
| ---------- | -------------------------------- | ------- |
| **Python** | Embedding models, data pipelines | 3.10+   |
| **Husky**  | Git hooks for pre-commit checks  | Latest  |

### 2.3 Development Tools

- **TypeScript Compiler** - Strict mode enabled
- **TSDoc** - Documentation generation
- **lint-staged** - Pre-commit linting
- **VSCode Extension API** - Extension development

---

## 3. Architecture Overview

### 3.1 High-Level System Architecture

```text
┌──────────────────────────┐
│     VSCode UI Layer      │
│──────────────────────────│
│ Sidebar Chat UI          │
│ Inline Completion        │
│ Commands / Code Actions  │
└──────────┬───────────────┘
           │ message passing
           ▼
┌──────────────────────────┐
│    Extension Layer       │
│──────────────────────────│
│ VSCode API Adapter       │
│ Permission Gate          │
│ Tool Invocation Bridge   │
└──────────┬───────────────┘
           │ structured events
           ▼
┌──────────────────────────┐
│      Core Engine         │
│──────────────────────────│
│ LLM Abstraction Layer    │
│ Context Engine           │
│ Agent Runtime            │
│ Prompt Assembly          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│    Local Services        │
│──────────────────────────│
│ LanceDB (Vector Store)   │
│ Embedding Provider       │
│ Shell / FS Sandbox       │
└──────────────────────────┘
```

### 3.2 Module Boundaries (CRITICAL)

The architecture enforces **strict module boundaries**:

#### ✅ Allowed Dependencies

```text
VSCode UI Layer
  ↓ (can import)
  Extension Layer types only

Extension Layer
  ↓ (can import)
  Core Engine public API

Core Engine
  ↓ (can import)
  Local Services
```

#### ❌ Forbidden Dependencies

```text
NEVER:
  Core → Extension
  Core → VSCode UI
  Local Services → Core
  UI → LLM APIs (direct)
  UI → File System (direct)
```

### 3.3 Core Subsystems

#### 3.3.1 VSCode UI Layer

**Responsibilities:**

- Render chat, tasks, and diffs
- Display inline completions
- Collect user input
- Show previews and confirmations

**Must NOT:**

- Call LLM APIs directly
- Read project files directly
- Make execution decisions

#### 3.3.2 Extension Layer (VSCode Adapter)

**Responsibilities:**

- Translate VSCode APIs → Core events
- Enforce permission checks
- Execute approved filesystem/shell actions
- Maintain editor state (active file, selection)

**Key APIs Used:**

- `vscode.Webview`
- `vscode.InlineCompletionItemProvider`
- `vscode.CodeActionProvider`
- `vscode.WorkspaceEdit`
- `vscode.Terminal`

#### 3.3.3 Core Engine

**Responsibilities:**

- LLM abstraction and provider management
- Context Engine orchestration
- Agent runtime and tool execution
- Prompt assembly and token budgeting

**Key Components:**

- **LLM Abstraction Layer** - Model-agnostic interface
- **Context Engine** - Intent-aware retrieval
- **Agent Runtime** - Multi-step task execution
- **Prompt Assembly** - Deterministic prompt construction

#### 3.3.4 Local Services

**Responsibilities:**

- **LanceDB** - Vector storage for embeddings
- **Embedding Provider** - Code-optimized embeddings
- **Shell/FS Sandbox** - Safe command execution

---

## 4. Context Engine Deep Dive

### 4.1 Context Engine Pipeline

```text
User Query
  ↓
Intent Classification
  ↓
Retrieval Strategy Selection
  ↓
Candidate Retrieval (Semantic + Lexical + Dependency)
  ↓
Ranking & Scoring
  ↓
Token Budget Allocation
  ↓
Prompt Packing
  ↓
LLM Request
```

### 4.2 Retrieval Methods

| Method          | Use Case                          | Priority  |
| --------------- | --------------------------------- | --------- |
| Semantic Search | Error explanations, refactoring   | Primary   |
| Lexical Search  | Identifier lookups, exact matches | Secondary |
| Dependency Walk | Call graphs, import relationships | Tertiary  |
| Recent Edits    | Bug fixing, context continuity    | Fallback  |

### 4.3 Token Budget Allocation

| Section | Allocation |
| ------- | ---------- |
| SYSTEM  | Fixed      |
| CONTEXT | 40-60%     |
| TASK    | 5-10%      |
| INPUT   | Variable   |
| OUTPUT  | Remainder  |

### 4.4 Non-Negotiables

- ❌ No direct file dumping
- ❌ No prompt mutation outside Context Engine
- ✅ Context Engine is MANDATORY for:
  - Agent tasks
  - Refactoring operations
  - Bug fixes
  - Multi-file queries

---

## 5. Development Workflow

### 5.1 Development Phases

| Phase   | Focus                             | Status      |
| ------- | --------------------------------- | ----------- |
| Phase 0 | Fork stabilization & infra        | In Progress |
| Phase 1 | Claude chat & inline completion   | Planned     |
| Phase 2 | Context Engine v1                 | Planned     |
| Phase 3 | Error explanation & docs          | Planned     |
| Phase 4 | Agent tools (controlled)          | Planned     |
| Phase 5 | Context Engine v2 (Augment-class) | Planned     |
| Phase 6 | UX, performance, reliability      | Planned     |

### 5.2 Git Workflow

1. **Branch Naming:**

   - `feat/<feature-name>` - New features
   - `fix/<bug-name>` - Bug fixes
   - `docs/<doc-name>` - Documentation
   - `refactor/<scope>` - Code refactoring

2. **Commit Convention:**

   ```text
   <type>(<scope>): <subject>

   <body>

   <footer>
   ```

3. **Pull Request Process:**
   - Create feature branch from `main`
   - Implement changes following coding standards
   - Run all checks locally (lint, test, build)
   - Submit PR with clear description
   - Address review feedback
   - Merge after approval and CI pass

### 5.3 Code Review Checklist

Before submitting a PR, verify:

- [ ] TypeScript compiles without errors (`tsc --noEmit`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier formatting applied (`pnpm format`)
- [ ] All tests pass (`pnpm test`)
- [ ] Test coverage meets 80% minimum
- [ ] Module boundaries respected
- [ ] TSDoc comments added for public APIs
- [ ] No hardcoded secrets or credentials
- [ ] Commit messages follow convention

---

## 6. Environment Setup

### 6.1 Prerequisites

Before starting development, ensure you have:

- **Node.js** 18.x or 20.x ([Download](https://nodejs.org/))
- **pnpm** 8.x+ (`npm install -g pnpm`)
- **VSCode** Latest version ([Download](https://code.visualstudio.com/))
- **Git** Latest version
- **Python** 3.10+ (for embedding scripts)

### 6.2 Initial Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/agent-naan.git
   cd agent-naan
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Configure VSCode:**

   - Install recommended extensions (see `.vscode/extensions.json`)
   - ESLint, Prettier, TypeScript extensions

5. **Set up pre-commit hooks:**

```bash
  pnpm prepare
```

### 6.3 Environment Variables

Create a `.env` file in the project root:

```bash
# Anthropic API Key (required for Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Embedding provider API key
EMBEDDING_API_KEY=...

# Optional: Development mode
NODE_ENV=development
```

**Security Note:** Never commit `.env` files. Use VSCode Secret Storage for production.

---

## 7. Build & Run Instructions

### 7.1 Development Mode

**Start the extension in development mode:**

```bash
# Terminal 1: Watch TypeScript compilation
pnpm watch

# Terminal 2: Run tests in watch mode
pnpm test:watch
```

**Launch VSCode Extension:**

1. Open the project in VSCode
2. Press `F5` or go to Run → Start Debugging
3. A new VSCode window opens with the extension loaded
4. Test the extension in the Extension Development Host

### 7.2 Build Commands

```bash
# Compile TypeScript
pnpm build

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration
```

### 7.3 Package Extension

```bash
# Build production bundle
pnpm build:prod

# Package as .vsix file
pnpm package

# Install packaged extension
code --install-extension agent-naan-0.1.0.vsix
```

---

## 8. Testing Strategy

### 8.1 Test Types

| Test Type       | Framework | Coverage Target | Location       |
| --------------- | --------- | --------------- | -------------- |
| Unit Tests      | Vitest    | 80% minimum     | `**/*.test.ts` |
| Integration     | Vitest    | Critical paths  | `**/*.spec.ts` |
| E2E (Extension) | VSCode    | Key workflows   | `test/e2e/`    |

### 8.2 Critical Path Coverage (100% Required)

- Context Engine retrieval pipeline
- Prompt assembly and token budgeting
- Permission checks and security gates
- Error handling and recovery

### 8.3 Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test context-engine.test.ts

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# View coverage in browser
open coverage/index.html
```

---

## 9. Project Structure

```text
agent-naan/
├── .augment/              # Augment Code rules and guidelines
│   └── rules/
│       ├── coding-standards.md
│       ├── project-guidelines.md
│       ├── review-checklist.md
│       ├── test-guidelines.md
│       └── workflow.md
├── docs/                  # Architecture and design docs
│   ├── architecture.md
│   ├── context-engine.md
│   ├── prompt-contracts.md
│   └── roadmap.md
├── src/                   # Source code (to be created)
│   ├── core/              # Core Engine (editor-agnostic)
│   │   ├── llm/           # LLM abstraction layer
│   │   ├── context/       # Context Engine
│   │   ├── agent/         # Agent runtime
│   │   └── prompt/        # Prompt assembly
│   ├── extension/         # VSCode Extension Layer
│   │   ├── adapters/      # VSCode API adapters
│   │   ├── permissions/   # Permission gates
│   │   └── tools/         # Tool invocation bridge
│   ├── ui/                # VSCode UI components
│   │   ├── chat/          # Chat sidebar
│   │   ├── completion/    # Inline completion
│   │   └── commands/      # Commands and actions
│   └── services/          # Local services
│       ├── lancedb/       # Vector database
│       ├── embeddings/    # Embedding provider
│       └── sandbox/       # Shell/FS sandbox
├── test/                  # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/               # Build and utility scripts
├── .vscode/               # VSCode workspace settings
├── CLAUDE.md              # Claude Code guidance
├── package.json           # Project metadata
├── pnpm-workspace.yaml    # pnpm workspace config
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Vitest configuration
└── .eslintrc.json         # ESLint configuration
```

---

## 10. Key Documentation

### 10.1 Required Reading

Before contributing, read these documents in order:

1. **CLAUDE.md** - Project overview and guiding principles
2. **docs/architecture.md** - System architecture and module boundaries
3. **docs/context-engine.md** - Context Engine specification
4. **docs/prompt-contracts.md** - Prompt structure rules
5. **.augment/rules/coding-standards.md** - Coding conventions

### 10.2 Reference Documentation

- **docs/roadmap.md** - Development phases and milestones
- **.augment/rules/test-guidelines.md** - Testing best practices
- **.augment/rules/review-checklist.md** - PR review criteria
- **.augment/rules/workflow.md** - Development workflow

---

## 11. Common Tasks

### 11.1 Adding a New LLM Provider

1. Implement `ILLMClient` interface in `src/core/llm/`
2. Add provider configuration
3. Update provider registry
4. Add unit tests
5. Update documentation

### 11.2 Extending the Context Engine

1. Define new retrieval strategy in `src/core/context/`
2. Implement retriever interface
3. Add ranking logic
4. Update token budget allocation
5. Add integration tests

### 11.3 Adding a New Agent Tool

1. Define tool interface in `src/core/agent/tools/`
2. Implement tool with permission checks
3. Register tool in Extension Layer
4. Add approval workflow
5. Add comprehensive tests

### 11.4 Debugging the Extension

1. Set breakpoints in TypeScript code
2. Press `F5` to launch Extension Development Host
3. Use Debug Console in VSCode
4. Check Output panel → "Extension Host"
5. Use VSCode Developer Tools (Help → Toggle Developer Tools)

---

## 12. Troubleshooting

### 12.1 Common Issues

#### Issue: TypeScript compilation errors

```bash
# Clear build cache
rm -rf dist/
pnpm build
```

#### Issue: Tests failing

```bash
# Clear test cache
pnpm test --clearCache
pnpm test
```

#### Issue: Extension not loading

```bash
# Rebuild and reload
pnpm build
# Press Ctrl+R in Extension Development Host
```

#### Issue: pnpm install fails

```bash
# Clear pnpm cache
pnpm store prune
pnpm install --force
```

### 12.2 Getting Help

- Check existing documentation in `docs/`
- Review `.augment/rules/` for guidelines
- Search GitHub issues
- Ask in team chat/discussion

---

## 13. Contributing Guidelines

### 13.1 Before You Start

1. Read all required documentation (Section 10.1)
2. Set up your development environment (Section 6)
3. Familiarize yourself with the architecture (Section 3)
4. Review coding standards (`.augment/rules/coding-standards.md`)

### 13.2 Contribution Process

1. **Find or create an issue** describing the work
2. **Assign yourself** to the issue
3. **Create a feature branch** from `main`
4. **Implement changes** following all guidelines
5. **Write tests** (minimum 80% coverage)
6. **Run all checks** locally
7. **Submit a PR** with clear description
8. **Address review feedback** promptly
9. **Merge** after approval and CI pass

### 13.3 Code of Conduct

- Be respectful and professional
- Follow architectural constraints
- Write clear, maintainable code
- Document your changes
- Test thoroughly
- Respond to feedback constructively

---

## 14. Guiding Principles

Remember these core principles when contributing:

1. **Context-first, model-second** - LLMs are commodities, context is the product
2. **IDE-native, not chatbot-centric** - Integration over isolation
3. **Human-in-the-loop by default** - Predictable, not autonomous
4. **Strict module boundaries** - Enforced separation of concerns
5. **Fail-safe over "smart"** - Reliability beats cleverness

> **LLMs reason. Context decides. Humans approve.**

---

## 15. License & Credits

- **License:** [To be determined]
- **Based on:** Continue.dev (open source)
- **LLM Provider:** Anthropic Claude 4.5
- **Inspiration:** Augment Code

---

## 16. Contact & Support

- **Repository:** [GitHub URL]
- **Issues:** [GitHub Issues URL]
- **Discussions:** [GitHub Discussions URL]
- **Documentation:** `docs/` directory

---

**Last Updated:** 2026-01-02
**Version:** 0.1.0 (Phase 0 - Foundation)
