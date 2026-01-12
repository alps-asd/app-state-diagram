# ADR 0003: AI Documentation Architecture

## Status

Accepted

## Context

This project provides two types of AI-oriented documentation:

1. **SKILL.md** (`.claude/skills/alps/SKILL.md`) - Claude Code skill definition
2. **llms.txt / llms-full.txt** (`docs/`) - LLM-optimized project documentation

Both documents contain overlapping content (validation codes, naming conventions, examples). We need to clarify their distinct roles to avoid duplication and ensure each serves its intended purpose effectively.

## Decision

### SKILL.md: "How to Write ALPS"

**Purpose**: Guide AI assistants in *creating* high-quality ALPS profiles from natural language descriptions.

**Audience**: Claude Code (and similar AI coding assistants) acting as ALPS authors.

**Content Focus**:
- What makes a "good" ALPS (design principles)
- Generation guidelines (Ontology → Taxonomy → Choreography workflow)
- Naming conventions with rationale
- Output format guidelines (XML default, JSON when requested)
- Validation as a mandatory post-generation step
- Complete examples demonstrating best practices
- Tips for better ALPS design

**Key Responsibility**: Transform user intent into well-structured ALPS profiles.

### llms.txt / llms-full.txt: "How to Use app-state-diagram"

**Purpose**: Document the *tool* for any LLM that needs to understand the project.

**Audience**: Any LLM (Claude, GPT, etc.) needing to:
- Use the CLI or programmatic API
- Set up MCP server integration
- Understand project architecture
- Troubleshoot validation errors

**Content Focus**:
- Installation and CLI usage
- Programmatic API (parser, validator, generator)
- MCP server configuration
- Validation error reference (for interpreting tool output)
- Project architecture
- Links to examples and external resources

**Key Responsibility**: Enable tool usage and integration.

### Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
│                "Create an ALPS for a blog app"                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SKILL.md                                 │
│                   "How to Write ALPS"                            │
│                                                                  │
│  • Design principles                                             │
│  • Generation workflow                                           │
│  • Naming conventions                                            │
│  • Format guidelines                                             │
│  • Complete examples                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                        [ALPS Profile Created]
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    llms.txt / llms-full.txt                      │
│                  "How to Use app-state-diagram"                  │
│                                                                  │
│  • CLI: asd --validate profile.json                              │
│  • API: AlpsValidator.validate()                                 │
│  • Error codes: E001, E002, ...                                  │
│  • MCP: validate_alps, alps2svg                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    [Validated & Visualized]
```

### Content Allocation

| Content | SKILL.md | llms.txt |
|---------|----------|----------|
| Design principles ("ideal ALPS") | Yes | No |
| Generation workflow | Yes | No |
| Naming conventions | Yes (with rationale) | Brief summary |
| Output format (XML/JSON) | Yes (detailed) | No |
| CLI usage | Reference only | Yes (detailed) |
| Programmatic API | No | Yes |
| MCP server setup | No | Yes |
| Validation codes | Reference to tool | Yes (detailed) |
| Error interpretation | No | Yes |
| Architecture | No | Yes |
| Complete ALPS examples | Yes | Minimal |

### Cross-References

- SKILL.md should reference llms.txt for:
  - Validation code details
  - CLI options

- llms.txt should reference:
  - ALPS specification (external: app-state-diagram.com/llms.txt)
  - Not SKILL.md (different audience)

## Consequences

### Positive

- Clear separation of concerns
- Each document optimized for its specific use case
- Reduced maintenance burden (no need to sync duplicate content)
- SKILL.md can be more opinionated about "good" ALPS
- llms.txt remains neutral and factual about tool usage

### Negative

- Some minimal duplication unavoidable (e.g., descriptor types table)
- Users might need both documents for complete understanding

### Neutral

- SKILL.md is Claude Code specific; other AI tools use llms.txt
- llms.txt follows llmstxt.org specification; SKILL.md follows Claude Code conventions
