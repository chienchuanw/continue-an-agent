# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **agent-naan**, a VSCode-native AI assistant built on a Continue.dev fork with Claude 4.5 as the primary LLM. The project aims to match or exceed Augment Code in context relevance, suggestion precision, and non-intrusive UX.

The core differentiator is the **Context Engine** - a sophisticated system that decides what information the model should see based on intent, relevance, and token budgets.

## High-Level Architecture

The system follows strict module boundaries:

```
VSCode Extension Layer
  ↓ (message passing)
Extension Layer (VSCode Adapter)
  ↓ (structured events)
Core Engine
  ├── LLM Abstraction Layer
  ├── Context Engine (Indexer, Retriever, Ranker, Prompt Packer)
  ├── Agent Runtime
  └── Prompt Assembly
  ↓
Local Services (LanceDB, Embedding Provider, Shell/FS Sandbox)
```

### Critical Architectural Constraints

- **UI Layer** must NEVER call LLM APIs or read project files directly
- **Extension Layer** enforces permissions and executes approved actions only
- **Core Engine** is editor-agnostic and contains all intelligence
- **Context Engine** is MANDATORY for all non-trivial requests
- **No autonomous file writes** - all mutations require approval
- **LLM providers are replaceable** - all must conform to the LLMClient interface

## Core Subsystems

### Context Engine

The most critical subsystem. It answers: "What information should the model see, and why?"

**Pipeline**: Intent Classification → Retrieval Strategy → Candidate Retrieval → Ranking → Token Budget Allocation → Prompt Packing

**Retrieval methods**:

- Semantic search (primary relevance)
- Lexical search (identifiers, errors)
- Dependency walk (call/import relationships)
- Recent edits (bug fixing)

**Token budget allocation**:

- User input: fixed
- Retrieved context: 40-60%
- Instructions: 10-15%
- Model response: remainder

**Non-negotiables**:

- No direct file dumping
- No prompt mutation outside the engine
- Context Engine is mandatory for agent tasks, refactors, and bug fixes

### Prompt Contracts

All prompts MUST follow this strict structure:

```
<SYSTEM>     - Identity, rules, non-negotiables (defined once, immutable)
<CONTEXT>    - Retrieved files & metadata (from Context Engine ONLY)
<TASK>       - What the model must do
<INPUT>      - User input/selection/diagnostics
<OUTPUT_CONSTRAINTS> - Format, length, style constraints
```

**Forbidden anti-patterns**:

- Inline prompt concatenation
- Mixing context with instructions
- Letting model decide context
- Dynamic system prompt mutation

### Agent Runtime

**Responsibilities**:

- Plan multi-step tasks
- Invoke tools through Extension layer
- Track execution steps
- Abort safely on failure

**Constraints**:

- Max step count enforced
- No silent execution
- All mutations require approval

## LLM Strategy

| Model             | Usage                                       |
| ----------------- | ------------------------------------------- |
| Claude Haiku 4.5  | Inline completion, low-latency tasks        |
| Claude Sonnet 4.5 | Chat, explanation, doc generation           |
| Claude Opus 4.5   | Complex reasoning, refactor, agent planning |

All LLM providers must implement:

```typescript
interface LLMClient {
  streamChat(messages, context): AsyncIterable<Token>;
  completeInline(context): AsyncIterable<Token>;
  runAgent(prompt, tools, context): AgentResult;
}
```

## Development Phases

| Phase   | Focus                             |
| ------- | --------------------------------- |
| Phase 0 | Fork stabilization & infra        |
| Phase 1 | Claude chat & inline completion   |
| Phase 2 | Context Engine v1                 |
| Phase 3 | Error explanation & docs          |
| Phase 4 | Agent tools (controlled)          |
| Phase 5 | Context Engine v2 (Augment-class) |
| Phase 6 | UX, performance, reliability      |

## Key Documentation

- `docs/architecture.md` - Authoritative system architecture with module boundaries
- `docs/context-engine.md` - Complete Context Engine specification
- `docs/prompt-contracts.md` - Strict prompt contract rules
- `docs/roadmap.md` - Development phases and completion criteria

## Guiding Principles

1. **Context-first, model-second** - LLMs are commodities, context is the product
2. **IDE-native, not chatbot-centric** - Integration over isolation
3. **Human-in-the-loop by default** - Predictable, not autonomous
4. **Strict module boundaries** - Enforced separation of concerns
5. **Fail-safe over "smart"** - Reliability beats cleverness

> **LLMs reason. Context decides. Humans approve.**

## Project Status

This is an early-stage project with comprehensive architectural documentation but minimal implementation. When implementing features:

- Adhere strictly to the module boundaries defined in `docs/architecture.md`
- Follow the Context Engine specification in `docs/context-engine.md`
- Respect the prompt contract rules in `docs/prompt-contracts.md`
- Consult the roadmap in `docs/roadmap.md` for phased development priorities
