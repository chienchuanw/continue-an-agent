# Context Engine Specification

## Continue.dev × Claude 4.5

This document defines the **authoritative specification** for the Context Engine.
It is the core differentiator of the system and MUST be implemented as described.

---

## 1. Purpose

The Context Engine exists to answer one question:

> **“What information should the model see, and why?”**

It is NOT:

- a file dumper
- a brute-force long-context loader
- a chat memory store

---

## 2. Design Principles

1. **Context is selected, not accumulated**
2. **Intent determines retrieval strategy**
3. **Relevance beats recency, unless intent says otherwise**
4. **Token budget is enforced centrally**
5. **Deterministic output for identical inputs**

---

## 3. High-Level Pipeline

```text
User Request
   ↓
Intent Classification
   ↓
Retrieval Strategy Selection
   ↓
Candidate Retrieval
   ↓
Ranking & Scoring
   ↓
Token Budget Allocation
   ↓
Prompt Packing
```

---

## 4. Intent Classification

### 4.1 Supported Intents (Initial)

| Intent   | Description                      |
| -------- | -------------------------------- |
| explain  | Explain code or behavior         |
| bug_fix  | Diagnose and fix errors          |
| refactor | Improve structure or readability |
| generate | Generate new code                |
| test     | Write or fix tests               |

### 4.2 Classifier Output

```ts
interface IntentResult {
  intent: IntentType;
  confidence: number;
}
```

Classifier can be rule-based initially, ML-based later.

---

## 5. Indexing Layer

### 5.1 Indexed Data Types

- File contents
- AST symbols (functions, classes)
- Import / dependency graph
- Git metadata (recency, ownership)

### 5.2 Storage

| Data     | Storage                |
| -------- | ---------------------- |
| Metadata | SQLite / DuckDB        |
| Vectors  | LanceDB                |
| Graph    | In-memory / serialized |

---

## 6. Retrieval Layer

### 6.1 Retrieval Methods

| Method          | Usage                     |
| --------------- | ------------------------- |
| Semantic search | Primary relevance         |
| Lexical search  | Identifiers, errors       |
| Dependency walk | Call/import relationships |
| Recent edits    | Bug fixing                |

### 6.2 Candidate Set

All retrieval methods contribute candidates to a unified set.

---

## 7. Ranking Layer

### 7.1 Scoring Formula

```text
score =
  semantic_similarity
+ dependency_weight
+ recency_boost
- scope_penalty
```

### 7.2 Scope Penalty

Penalize:

- test files when intent ≠ test
- vendor / build directories
- generated files

---

## 8. Token Budgeting

### 8.1 Budget Allocation

| Section           | %         |
| ----------------- | --------- |
| User input        | fixed     |
| Retrieved context | 40–60%    |
| Instructions      | 10–15%    |
| Model response    | remainder |

### 8.2 Hard Limits

Context Engine must truncate, never overflow.

---

## 9. Prompt Packing

### 9.1 Deterministic Structure

```text
SYSTEM
  Role & rules

CONTEXT
  File A
  File B

USER
  Original prompt
```

### 9.2 Ordering Rules

- Higher score first
- Same file grouped
- Stable ordering

---

## 10. Caching Strategy

- Query-level cache
- Embedding reuse
- Invalidation on file save

---

## 11. Failure Modes

| Failure         | Behavior                |
| --------------- | ----------------------- |
| No candidates   | Fall back to local file |
| Budget overflow | Drop lowest score       |
| Index missing   | Warn + rebuild          |

---

## 12. Non-Negotiables

- No direct file dumping
- No prompt mutation outside engine
- Context Engine is mandatory for:
  - agent tasks
  - refactors
  - bug fixes

---

## 13. Definition of Success

- Fewer manual file selections
- Smaller prompts, better answers
- Predictable, explainable behavior

---

## 14. Guiding Principle

> **The model reasons.  
> The context decides.**
