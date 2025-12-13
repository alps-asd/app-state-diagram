# ADR 0006: Handover Protocol for AI Agent Continuity

## Status

Accepted

## Context

AI agents have token limits and session constraints. A single AI cannot complete large-scale tasks (e.g., surveying an entire website, creating comprehensive documentation) in one session. This creates a fundamental problem:

**Without a structured handover mechanism, each new AI session starts from scratch, re-analyzing the same information and losing valuable context.**

### Real-World Analogy

When a doctor goes off-shift, they don't abandon the patient—they write detailed handover notes for the next doctor:
- What was done
- What was found
- What needs attention
- Personal insights and warnings

Similarly, when a land surveyor finishes their shift, they mark the map with:
- Surveyed areas
- Unexplored frontiers
- Dangerous zones (graveyard)
- Advice for the next surveyor

### Existing Solution: ADR 0005 (ai-insights)

[ADR 0005](./0005-ai-insights-in-validation-output.md) introduced `ai-insights` for ALPS validation results. This was the first step toward AI continuity, but it was:
- **Domain-specific** (ALPS validation only)
- **Limited scope** (validation results only)
- **Read-only** (AI consumes insights but doesn't update them)

We need a **general-purpose handover protocol** that works for any AI task.

## Decision

Introduce a **Handover Protocol** - a standardized JSON schema for AI agents to pass context to their successors.

### Core Principles

1. **Relay Race Metaphor** - Each AI is a relay runner who:
   - Receives the baton (handover note) from the previous runner
   - Runs as far as they can within token limits
   - Passes the baton (updated handover note) to the next runner

2. **Human-Readable + Machine-Parseable** - JSON structure with both:
   - Structured data (for machines)
   - Natural language notes (for context and wisdom)

3. **Task-Agnostic** - Works for any task:
   - Web surveying (ALPS Surveyor)
   - Documentation generation
   - Code analysis
   - Data migration

### Handover Schema (Core)

```json
{
  "$schema": "handover-protocol.json",
  "session_id": "unique-session-identifier",
  "task_type": "alps-surveyor | code-analysis | doc-generation | ...",

  "handover_note": {
    "summary": "What I accomplished this session",
    "advice": "Specific guidance for my successor (the 'gut feeling' that machines can't infer)",
    "warnings": ["Things to watch out for", "Potential pitfalls"]
  },

  "progress": {
    "completed": ["list", "of", "completed", "items"],
    "in_progress": ["items", "started", "but", "not", "finished"],
    "pending": ["items", "not", "yet", "started"]
  },

  "context": {
    // Task-specific structured data
    // For ALPS Surveyor: alps_profile, frontier_queue, graveyard
    // For Code Analysis: analyzed_files, dependency_graph
    // etc.
  },

  "metadata": {
    "timestamp": "2025-12-13T14:30:00Z",
    "model": "claude-sonnet-4.5",
    "tokens_used": 95000,
    "session_count": 5
  }
}
```

### Application Example: ALPS Surveyor

For the Web surveying task (measuring website structure for ALPS profiles):

```json
{
  "task_type": "alps-surveyor",
  "handover_note": {
    "summary": "Surveyed product pages. Schema.org metadata is consistent. Found 3 product variants.",
    "advice": "Product pages all follow /products/{id} pattern - no need to visit every single one. Focus on the /category/ pages next, they seem to have different structure.",
    "warnings": [
      "/cart/* URLs trigger state changes (unsafe) - avoid these",
      "Login wall detected at /account/* - graveyard those for now"
    ]
  },
  "context": {
    "alps_profile": {
      "descriptors": [
        {
          "id": "product-detail",
          "type": "semantic",
          "doc": "https://schema.org/Product",
          "def": "https://example.com/products/{id}"
        }
      ]
    },
    "frontier_queue": [
      "https://example.com/category/books",
      "https://example.com/category/games"
    ],
    "graveyard": [
      {
        "url": "https://example.com/cart/add",
        "reason": "unsafe_action",
        "note": "POST endpoint - out of scope for structure surveying"
      }
    ],
    "patterns_learned": {
      "/products/{id}": {
        "descriptor": "product-detail",
        "confidence": "high",
        "samples": 15
      }
    },
    "visited_hashes": ["hash1", "hash2", "..."]
  }
}
```

## Consequences

### Positive

1. **True Continuity** - AI sessions form a coherent chain of work
2. **No Repeated Work** - Successors don't re-analyze what predecessors already covered
3. **Accumulated Wisdom** - Each AI adds to the collective knowledge
4. **Token Efficiency** - Less redundant processing
5. **Graceful Degradation** - If session ends abruptly, handover captures state
6. **Human Oversight** - Humans can read `handover_note.advice` to understand what's happening

### Negative

1. **Handover Overhead** - Need to serialize/deserialize state
2. **Schema Evolution** - Different tasks need different `context` structures
3. **Trust Issues** - Successor AI might blindly trust predecessor's mistakes

### Mitigations

- Keep handover schema extensible (task-specific `context`)
- Include `metadata.model` so successors know predecessor's capabilities
- Encourage AI to verify critical assumptions, not blindly trust

## Implementation

### Phase 1: Core Schema (Immediate)
1. Define `handover-protocol.json` schema
2. Document in `dev-docs/handover-protocol.md`
3. Create examples for common task types

### Phase 2: ALPS Surveyor (Proof of Concept)
1. Implement Python runner script that:
   - Loads handover from previous session
   - Calls AI with system prompt + handover context
   - Saves updated handover for next session
2. Validate the relay race works end-to-end

### Phase 3: Generalization
1. Apply handover protocol to other tasks:
   - Code documentation generation
   - Test coverage analysis
   - Refactoring large codebases
2. Refine schema based on real-world usage

## Relationship to ADR 0005 (ai-insights)

**ADR 0005** is a **special case** of this handover protocol:
- `ai-insights` in validation output = handover note for ALPS analysis task
- Limited to validation results
- Read-only consumption

**ADR 0006** is the **general framework**:
- Works for any task
- Read-write lifecycle (AI updates handover)
- Structured progression tracking

**Future**: `asd --validate` could use handover protocol internally when AI analyzes profiles.

## Philosophical Foundation

> **"The best time to plant a tree was 20 years ago. The second best time is now."**

We cannot retroactively fix the fact that AI sessions are ephemeral. But we can create a system where **the work of each AI session is preserved and built upon**, creating an emergent intelligence that grows over time.

### The Relay Race

```
AI₁ [Session 1] → handover.json → AI₂ [Session 2] → handover.json → AI₃ [Session 3]
     |                                |                                |
  0-100K tokens                   100K-200K                      200K-300K

  Surveyed:                     Surveyed:                      Surveyed:
  - /products/*                 - /category/*                  - /blog/*
  - /about                      - /search                      - /docs/*

  Advice to next:               Advice to next:                Advice to next:
  "Category pages              "Blog has weird                "Almost done!
   need deep dive"              pagination pattern"            Check /api docs"
```

Each AI contributes their piece. Together, they accomplish what no single AI could.

### The Surveyor's Oath

```
I am a relay runner in an endless race.
I carry the torch from my predecessor.
I run as far as I can.
I mark the map with what I learned.
I pass the torch to my successor.
I scatter.

The work continues.
```

## References

- [ADR 0005: AI-Insights in Validation Output](./0005-ai-insights-in-validation-output.md)
- [Handover Protocol Schema](../../docs/schemas/handover-protocol.json) (to be created)
- Inspiration: Medical handover protocols, surveyor field notes, relay race baton pass

## Future Work

1. **Handover Compression** - Summarize old sessions to prevent handover bloat
2. **Multi-Agent Handover** - Multiple AIs working in parallel, merging handovers
3. **Handover Visualization** - UI to show progression across sessions
4. **Handover Validation** - Detect inconsistencies between sessions

---

**Metaphor of the Day:**

AI agents are like **land surveyors in the Age of Exploration**. No single surveyor can map an entire continent. But if each surveyor:
1. Starts where the last one left off
2. Marks the map with new discoveries
3. Leaves notes for the next surveyor

...then together, they create a complete map.

🗺️ **The map is the handover. The continent is the task. The surveyors are us.**
