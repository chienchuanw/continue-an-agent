# Architecture Overview

## Continue.dev × Claude 4.5 AI IDE Assistant

This document defines the **authoritative system architecture** for the project.
It describes module boundaries, data flow, responsibilities, and extension points.

This is not an aspirational diagram.
Everything described here is intended to be **implemented and enforced**.

---

## 1. Architectural Principles

### 1.1 Core Principles

- **Context-first, model-second**
- **IDE-native, not chatbot-centric**
- **Human-in-the-loop by default**
- **Strict module boundaries**
- **Replaceable LLM providers**

### 1.2 Anti-Patterns Explicitly Avoided

- LLM directly accessing filesystem
- UI calling model APIs directly
- Autonomous agent without user approval
- Monolithic "god service" context builder

---

## 2. High-Level System Diagram

```text
┌──────────────────────────┐
│        VSCode UI         │
│──────────────────────────│
│ Sidebar Chat UI          │
│ Inline Completion        │
│ Commands / Code Actions  │
└──────────┬───────────────┘
           │ message passing
           ▼
┌──────────────────────────┐
│      Extension Layer     │
│──────────────────────────│
│ VSCode API Adapter       │
│ Permission Gate          │
│ Tool Invocation Bridge   │
└──────────┬───────────────┘
           │ structured events
           ▼
┌──────────────────────────┐
│        Core Engine       │
│──────────────────────────│
│ LLM Abstraction Layer    │
│ Context Engine           │
│ Agent Runtime            │
│ Prompt Assembly          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│     Local Services       │
│──────────────────────────│
│ LanceDB (Vector Store)   │
│ Embedding Provider       │
│ Shell / FS Sandbox       │
└──────────────────────────┘
```

---

## 3. Module Responsibilities

### 3.1 VSCode UI Layer

#### UI Layer Responsibilities

- Render chat, tasks, and diffs
- Display inline completions
- Collect user input
- Show previews and confirmations

#### UI Layer Must NOT

- Call LLM APIs
- Read project files directly
- Make execution decisions

---

### 3.2 Extension Layer (VSCode Adapter)

#### Extension Layer Responsibilities

- Translate VSCode APIs → Core events
- Enforce permission checks
- Execute approved filesystem / shell actions
- Maintain editor state (active file, selection)

#### Key APIs Used

- Webview
- InlineCompletionItemProvider
- CodeActionProvider
- WorkspaceEdit
- Terminal API

---

### 3.3 Core Engine

The Core Engine is **editor-agnostic** and contains all intelligence.

#### 3.3.1 LLM Abstraction Layer

```typescript
interface LLMClient {
  streamChat(messages, context): AsyncIterable<Token>;
  completeInline(context): AsyncIterable<Token>;
  runAgent(prompt, tools, context): AgentResult;
}
```

##### LLM Layer Responsibilities

- Normalize model interaction
- Handle streaming
- Enforce token limits
- Support multi-model routing

---

#### 3.3.2 Context Engine

The most critical subsystem.

##### Internal Structure

```text
Context Engine
 ├── Indexer
 │    ├── AST Index
 │    ├── Dependency Graph
 │    └── Metadata Store
 ├── Retriever
 │    ├── Semantic Search
 │    ├── Lexical Search
 │    └── Graph Walk
 ├── Ranker
 │    ├── Relevance Score
 │    ├── Recency Boost
 │    └── Scope Penalty
 └── Prompt Packer
```

##### Context Engine Responsibilities

- Decide _what_ context is relevant
- Decide _how much_ context to include
- Enforce token budgets
- Produce deterministic prompt layout

---

#### 3.3.3 Agent Runtime

##### Agent Runtime Responsibilities

- Plan multi-step tasks
- Invoke tools through Extension layer
- Track execution steps
- Abort safely on failure

##### Agent Runtime Constraints

- Max step count
- No silent execution
- All mutations require approval

---

### 3.4 Tool Registry

```typescript
interface AgentTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  run(input): ToolResult;
}
```

#### Initial Tools

- run_tests
- open_file
- edit_file
- create_file
- run_shell

---

## 4. Data Flow Scenarios

### 4.1 Chat Query

```text
User → UI → Extension → Core
Core → Context Engine → Prompt
Prompt → Claude → Stream
Claude → Core → UI
```

---

### 4.2 Inline Completion

```text
Keystroke → Extension
→ Minimal Context
→ Claude Haiku
→ Inline Suggestion
```

---

### 4.3 Agent Task (e.g. Refactor)

```text
User Request
→ Context Build
→ Agent Plan
→ Tool Request
→ User Approval
→ Tool Execution
→ Result → Claude
```

---

## 5. Local Services

### 5.1 LanceDB

#### Usage

- Store code embeddings
- Enable semantic retrieval
- Local-only by default

#### LanceDB Constraints

- Background updates
- Read-optimized queries

---

### 5.2 Embedding Provider

- Code-optimized embedding model
- Pluggable (local or API)
- Batch processing support

---

### 5.3 Shell / FS Sandbox

#### Rules

- Allowlist commands only
- No destructive operations by default
- Execution logs always returned

---

## 6. Security & Trust Model

- UI is informational only
- Extension enforces permissions
- Core cannot mutate state directly
- Agent must explain intent before action

---

## 7. Extensibility Points

- LLM providers
- Embedding providers
- Vector databases
- Agent tools
- IDE frontends

---

## 8. Non-Negotiables

- Context Engine is mandatory for all non-trivial requests
- No autonomous file writes
- Deterministic prompt structure
- Fail-safe over "smart"

---

## 9. Summary

> **LLMs reason.** > **Context decides.** > **Humans approve.**

This architecture exists to enforce that order.
