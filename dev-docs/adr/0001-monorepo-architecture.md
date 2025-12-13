# ADR 0001: Editor-first Architecture

## Status

Accepted (Revised)

## Context

The ALPS (Application-Level Profile Semantics) tooling ecosystem originally consisted of two separate repositories:

1. **app-state-diagram** - CLI tool for generating HTML documentation (originally PHP, TypeScript rewrite attempted on `ts` branch)
2. **alps-editor** - Browser-based online editor for ALPS documents (JavaScript)

Both repositories shared significant functionality:
- ALPS document parsing (JSON/XML)
- DOT graph generation
- HTML/table generation
- SVG rendering (via Viz.js)

Initial approach was to create a shared TypeScript core library (`@alps-asd/core`). However, this led to:
- Duplicating working JavaScript code in TypeScript
- Maintaining two implementations of the same algorithms
- Unnecessary complexity for a project this size

## Decision

**Editor-first architecture**: The browser-based editor (`/public/`) is the source of truth for all UI logic. The CLI is a minimal Node.js adapter.

### Final Structure

```
app-state-diagram/
├── public/                     # Browser editor (GitHub Pages)
│   ├── index.html
│   └── js/
│       ├── scripts.js          # Editor UI
│       ├── diagramAdapters.js  # DOT/SVG/HTML generation
│       └── descriptor2table.js # Table utilities
│
├── packages/
│   └── cli/                    # @alps-asd/cli (Node.js adapter)
│       └── src/
│           ├── asd.ts          # CLI entry point
│           ├── parser/         # ALPS parsing (fast-xml-parser)
│           ├── generator/      # DOT, SVG, HTML (ported from JS)
│           └── resolver/       # External reference resolution
│
└── docs/
```

### Design Principles

1. **JavaScript is the source of truth**: The editor's JavaScript code (`public/js/`) defines the canonical implementation
2. **CLI is an adapter**: The CLI provides Node.js-specific functionality (file I/O, fast-xml-parser for XML) while replicating the browser algorithms
3. **No shared code package**: Instead of a shared `@alps-asd/core`, the CLI contains its own TypeScript port of the necessary functions
4. **Static hosting**: The editor runs on GitHub Pages with no build step

### Why Not TypeScript Everywhere?

| Factor | Assessment |
|--------|------------|
| Code size | ~1000 lines - manageable without TypeScript |
| Team size | Single maintainer |
| Complexity | Straightforward data transformation |
| UI framework | Unnecessary for this single-page app |
| Build step | Avoided for simpler deployment |

### Alignment Decisions (alps-editor as reference)

| Aspect | Value |
|--------|-------|
| Tag separator | space-separated |
| Idempotent color | #D4A000 |
| Safe color | #00A86B |
| Unsafe color | #FF4136 |
| Label modes | ID / Title radio buttons |
| Size modes | Original / Fit to width |
| Auto size selection | Based on SVG width |

## Consequences

### Positive
- Minimal complexity
- No build step for editor
- Working code preserved (not rewritten)
- CLI provides Node.js access to same algorithms
- GitHub Pages hosting for editor

### Negative
- Two implementations (JavaScript browser, TypeScript CLI)
- Manual sync required when algorithms change
- No shared type definitions

### Tradeoffs Accepted
- Duplication is acceptable for this project size
- TypeScript benefits (types, tooling) only in CLI
- Browser code remains vanilla JavaScript

## Revision History

- **Initial**: Proposed three-package monorepo with shared core
- **Revised**: Simplified to editor-first architecture with CLI adapter
