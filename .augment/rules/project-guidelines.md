# Project Guidelines

**agent-naan**: VSCode-native AI assistant on Continue.dev fork with Claude 4.5.

**Core**: Context Engine answers "What information should the model see, and why?" using intent classification, semantic retrieval, token budgeting, and deterministic prompt assembly.

**Goals**: VSCode-native assistant, first-class Context Engine, human-in-the-loop tools, modular architecture.

**Status**: Phase 0 - Foundation (early-stage, comprehensive docs, minimal implementation).

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

See `.augment/rules/workflow.md` for complete Git Flow, commit conventions, PR guidelines, CI/CD, versioning, and deployment processes.

---

## 6. Environment Setup

**Prerequisites**: Node.js 18.x+, pnpm 8.x+, VSCode, Git, Python 3.10+

**Setup**:

```bash
git clone https://github.com/your-org/agent-naan.git
cd agent-naan
pnpm install
cp .env.example .env
pnpm prepare
```

**Environment Variables**: Set `ANTHROPIC_API_KEY` in `.env` (never commit)

---

## 7. Build & Run Instructions

**Development Mode**:

```bash
pnpm watch          # Watch TypeScript compilation
pnpm test:watch     # Run tests in watch mode
# Press F5 in VSCode to launch Extension Development Host
```

**Build Commands**:

```bash
pnpm build          # Compile TypeScript
pnpm lint           # Run linter
pnpm format         # Format code
pnpm test           # Run all tests
pnpm test:coverage  # Run tests with coverage
pnpm build:prod     # Production build
pnpm package        # Package as .vsix
```

## 8. Testing Strategy

**Test Types**: Unit (80% minimum), Integration (critical paths), E2E (key workflows)

**Critical Paths (100% Required)**:

- Context Engine retrieval pipeline
- Prompt assembly and token budgeting
- Permission checks and security gates
- Error handling and recovery

**Running Tests**:

```bash
pnpm test                    # Run all tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage
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

## 9. Key Documentation

Before contributing, read: CLAUDE.md → docs/architecture.md → docs/context-engine.md → docs/prompt-contracts.md → .augment/rules/coding-standards.md

---

## 10. Guiding Principles

1. **Context-first, model-second** - LLMs are commodities, context is the product
2. **IDE-native, not chatbot-centric** - Integration over isolation
3. **Human-in-the-loop by default** - Predictable, not autonomous
4. **Strict module boundaries** - Enforced separation of concerns
5. **Fail-safe over "smart"** - Reliability beats cleverness

> **LLMs reason. Context decides. Humans approve.**

---

**Last Updated:** 2026-01-02
**Version:** 0.1.0 (Phase 0 - Foundation)
