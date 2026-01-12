# ADR 0005: AI-Insights in Validation Output

## Status

Accepted

## Context

When AI assists in creating or improving ALPS profiles, there's valuable contextual knowledge that gets lost between sessions:

- Complexity assessment ("this is a two-sided marketplace")
- Coverage gaps ("team management is not modeled, 0%")
- Key flows and their characteristics
- Recommendations for improvement

**Problem**: Each AI session starts from scratch, re-analyzing the same profile repeatedly without building on previous work.

**Observation**: Human developers leave code comments for their successors. Why shouldn't AI leave insights for the next AI?

## Decision

Add an **`ai-insights`** field to the validation output (`asd --validate`) containing subjective analysis by AI.

### Structure

```json
{
  "valid": true,
  "summary": "✓ ALPS document is valid",
  "errors": [],
  "warnings": [],
  "suggestions": [],
  "statistics": { ... },

  "ai-insights": {
    "complexity": "high",
    "assessment": "Large two-sided marketplace (customer + lawyer)...",
    "key_flows": [
      "flow-hire: 12 states, longest customer journey",
      "flow-lawyer-work: 15 states, most complex workflow"
    ],
    "coverage_gaps": [
      "Team management for multi-lawyer firms (0%)",
      "Detailed billing/tax management (20%)"
    ],
    "recommendations": [
      "Consider splitting lawyer-work into sub-flows",
      "Add error handling states in quote flow"
    ]
  }
}
```

### Key Principles

1. **AI-only field** - Only generated when AI runs validation, not when humans run it
2. **Subjective** - Unlike `statistics` (objective), this is AI's interpretation
3. **Model-dependent** - Different models (Sonnet, Opus) may produce different insights
4. **Evolvable** - Future AIs can add richer analysis as capabilities improve
5. **Optional** - Not required for validation to pass

## Consequences

### Positive

1. **Knowledge Continuity** - AI inherits the mission from previous AI
   ```
   AI₁: Creates profile → ai-insights ("coverage_gaps: Team管理 0%")
     ↓
   AI₂: Reads insights → Focuses on Team管理 → Updates insights
     ↓
   AI₃: Builds on previous work → Deeper analysis...
   ```

2. **Faster Analysis** - Next AI doesn't start from scratch
3. **Consistent Context** - Humans also benefit from seeing AI's assessment at a glance
4. **Transparent** - Coverage gaps are explicitly documented, not hidden
5. **Honest Reporting** - AI can say "I only covered 60% of this domain" in a structured way

### Negative

1. **Non-deterministic** - Different AI models produce different insights
2. **Potential Bias** - Next AI might over-rely on previous insights instead of fresh analysis
3. **Schema Maintenance** - Need to evolve schema as AI capabilities improve

### Mitigations

- Field name `ai-insights` (not `analysis` or `assessment`) makes subjective nature clear
- Schema is flexible to allow evolution
- Encourage AI to "build upon" not "blindly follow" previous insights

## Implementation

1. **Validation Output**: Add `ai-insights` field to JSON output
2. **Schema**: Define at `docs/schemas/validation-result.json`
3. **ALPS Skill**: Update skill to:
   - Generate `ai-insights` when creating/validating profiles
   - Read and build upon existing `ai-insights` when improving profiles
4. **Documentation**: Update SKILL.md with "Continuous Improvement Loop"

## Alternatives Considered

### 1. Separate `.ai-analysis.json` file
- **Rejected**: Separates insights from validation results; harder to discover

### 2. Include in ALPS profile itself
- **Rejected**: ALPS profile should be AI-agnostic; validation output is the right place

### 3. Human-readable text file
- **Rejected**: JSON is parseable by both AI and humans (pretty-printed)

## References

- [Validation Result Schema](../../docs/schemas/validation-result.json)
- [ALPS Skill Documentation](../../.claude/skills/alps/SKILL.md)
- Inspired by: Developer code comments, architectural decision records (ADRs themselves!)

## Metaphor

**"AI inherits the mission from previous AI, like developers reading code comments left by their predecessors."**

Just as developers write comments for future maintainers, AI writes insights for future AI assistants—creating a continuity of knowledge that improves with each iteration.
