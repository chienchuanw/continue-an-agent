# Continue.dev × Claude 4.5

## AI IDE Assistant – Development Roadmap

> This document defines the **authoritative development roadmap** for building
> a production-grade, Augment-Code-class IDE AI assistant based on a
> Continue.dev fork.
>
> It is intended to be used as:
>
> - a long-term architectural guide
> - a feature completion checklist
> - a quality and scope evaluation standard

---

## 0. Project Goals & Non-Goals

### 0.1 Core Goals

- Build a **VSCode-native AI assistant** with:
  - Claude 4.5 as primary LLM (Haiku / Sonnet / Opus)
  - First-class **Context Engine** (multi-file, semantic, intent-aware)
  - High trust, **human-in-the-loop agent tools**
- Match or exceed **Augment Code** in:
  - context relevance
  - suggestion precision
  - non-intrusive UX
- Architecture must be:
  - modular
  - model-agnostic
  - long-term maintainable

### 0.2 Explicit Non-Goals

- Not a Copilot clone
- Not a fully autonomous “Cline-style” agent
- Not a chat-only wrapper around LLM APIs

---

## 1. High-Level Architecture

```text
VSCode Extension
  Sidebar UI (Chat / Tasks)
  Inline Completion Provider
  Commands & Code Actions

  Core Bridge
      ↓
Core Engine (Node)
  LLM Abstraction Layer
  Context Engine
      Indexer
      Retriever
      Ranker
      Prompt Assembler
  Agent Runtime
  Tool Registry
      ↓
Local Services
  LanceDB (Vector Store)
  Embedding Provider
  Shell / FS Sandbox
```

---

## 2. LLM Strategy (Claude 4.5)

### 2.1 Supported Models

| Model             | Usage                                       |
| ----------------- | ------------------------------------------- |
| Claude Haiku 4.5  | Inline completion, low-latency tasks        |
| Claude Sonnet 4.5 | Chat, explanation, doc generation           |
| Claude Opus 4.5   | Complex reasoning, refactor, agent planning |

### 2.2 LLM Abstraction Contract

```ts
interface LLMClient {
  streamChat(messages, context): AsyncIterable<Token>;
  completeInline(context): AsyncIterable<Token>;
  runAgent(prompt, tools, context): AgentResult;
}
```

All future providers (OpenAI / Gemini) must conform to this interface.

---

## 3. Development Phases Overview

| Phase   | Focus                             |
| ------- | --------------------------------- |
| Phase 0 | Fork stabilization & infra        |
| Phase 1 | Claude chat & inline completion   |
| Phase 2 | Context Engine v1                 |
| Phase 3 | Error explanation & docs          |
| Phase 4 | Agent tools (controlled)          |
| Phase 5 | Context Engine v2 (Augment-class) |
| Phase 6 | UX, performance, reliability      |

---

## Phase 0 – Foundation & Fork Stabilization

### Objectives

- Establish long-term maintainable fork of Continue.dev
- Decouple Core, UI, and Context logic

### Deliverables

- [ ] Forked Continue repo under own org
- [ ] Clear module boundaries:
  - `core/`
  - `context-engine/`
  - `extension/`
- [ ] LLM provider abstraction implemented
- [ ] Claude provider implemented (non-stream + stream)
- [ ] API key storage via VSCode Secret Storage

### Acceptance Criteria

- Claude chat works via Core, not directly from UI
- Switching model does not change UI logic

---

## Phase 1 – Claude Chat & Inline Completion

### 1. Claude Chat (Sidebar)

#### 1.1 Features

- Streaming responses
- Multi-turn conversation
- Model selection (Haiku / Sonnet / Opus)
- Context injection hooks (empty for now)

#### 1.2 Acceptance Criteria

- No blocking UI
- Token streaming visible
- Conversation state survives reload

---

### 2. Inline Completion

#### 2.1 Features

- Inline ghost text
- Debounced requests
- Language-agnostic

#### 2.2 Context (minimal)

- Current line
- Surrounding function
- Language metadata

#### 2.3 Acceptance Criteria

- No completion spam
- Cancels outdated requests
- Haiku used by default

---

## Phase 2 – Context Engine v1 (Functional)

### Objective

Move beyond single-file context.

### 2.1 Indexing

#### Indexed Data

- File content
- Symbols (AST)
- Import / dependency graph
- Git metadata (recency)

---

### 2.2 Embedding Pipeline

- Chunking at function / class level
- Incremental updates on save
- Background indexing

---

### 2.3 Context Query API

```ts
ContextEngine.query({
  intent,
  activeFile,
  selection,
  tokenBudget,
});
```

---

## Phase 3 – Error Explanation & Documentation

### 3.1 Error Explanation

- Diagnostics
- Active file
- Dependency graph
- Recent edits

---

### 3.2 Documentation Generation

- Function / class docs
- Module-level README
- API comments

---

## Phase 4 – Agent Tools (Controlled Execution)

### Tool Interface

```ts
interface AgentTool {
  name;
  description;
  schema;
  run(input): ToolResult;
}
```

---

## Phase 5 – Context Engine v2 (Augment-Class)

- Intent-aware retrieval
- Advanced ranking
- Deterministic prompt packing

---

## Phase 6 – UX, Performance, Reliability

- Non-intrusive UX
- Async indexing
- Safe agent aborts

---

## 7. Definition of “Done”

- Context relevance exceeds Copilot / Cursor
- Agent actions are predictable and reversible
- Developers work faster without friction

---

## 8. Guiding Principle

> **LLMs are commodities.  
> Context is the product.**
