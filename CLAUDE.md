# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALPS (Application-Level Profile Semantics) tooling. Generates HTML documentation and state diagrams from ALPS profiles.

**Architecture**: Editor-first design. Browser editor (`/public/`) is the source of truth. CLI is a Node.js adapter.

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

## Project Structure

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
│   └── cli/                    # @alps-asd/cli (Node.js)
│       └── src/
│           ├── asd.ts          # CLI entry point
│           ├── parser/         # ALPS parsing (fast-xml-parser)
│           ├── generator/      # DOT, SVG, HTML generation
│           └── resolver/       # External reference resolution
│
└── docs/
    ├── architecture.md
    └── adr/
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Build CLI
pnpm --filter @alps-asd/cli build

# CLI usage (after build)
node packages/cli/dist/asd.js profile.json
node packages/cli/dist/asd.js profile.xml
node packages/cli/dist/asd.js profile.json -f svg
node packages/cli/dist/asd.js profile.json -f dot --echo
node packages/cli/dist/asd.js profile.json --label title
```

## Key Files

### Browser Editor (public/js/)

| File | Description |
|------|-------------|
| `scripts.js` | Ace Editor, validation UI, preview |
| `diagramAdapters.js` | DOT generation, HTML template, Viz.js integration |
| `descriptor2table.js` | Table generation, tag extraction |

### CLI (packages/cli/src/)

| File | Description |
|------|-------------|
| `asd.ts` | CLI entry point (commander) |
| `parser/alps-parser.ts` | ALPS parsing (fast-xml-parser for XML) |
| `generator/dot-generator.ts` | DOT graph generation |
| `generator/svg-generator.ts` | SVG generation (@viz-js/viz WASM) |
| `generator/html-generator.ts` | HTML document generation |
| `generator/table-functions.ts` | Table utilities (ported from JS) |
| `resolver/file-resolver.ts` | External reference resolution |

## Descriptor Types

| Type | Color | Naming |
|------|-------|--------|
| semantic | White | - |
| safe | #00A86B | `goXxx` |
| unsafe | #FF4136 | `doXxx` |
| idempotent | #D4A000 | `doXxx` |

## Design Notes

- Tag separator: space-separated (not comma)
- Browser uses DOMParser for XML, CLI uses fast-xml-parser
- HTML output includes client-side Viz.js for label mode switching
- Keep browser and CLI implementations in sync when algorithms change
