# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

app-state-diagram is a TypeScript monorepo that generates visual state diagrams and documentation from ALPS (Application-Level Profile Semantics) profiles. It reads XML or JSON profile files and creates interactive diagrams showing application state transitions.

## Essential Commands

```bash
# Install dependencies
pnpm install

# Build all packages (required before running CLI)
pnpm build

# Run all tests
pnpm test

# Run a single test file
npx jest packages/app-state-diagram/src/generator/dot-generator.test.ts

# Run tests for a specific package
pnpm --filter @alps-asd/app-state-diagram test
pnpm --filter @alps-asd/mcp test

# Run CLI locally after build
node packages/app-state-diagram/dist/asd.js <profile.json|profile.xml>
```

### CLI Usage

```bash
asd profile.json                    # Generate HTML
asd profile.json -f svg             # Generate SVG
asd profile.json -f mermaid         # Generate Mermaid classDiagram
asd profile.json -f dot             # Generate DOT
asd profile.json --validate         # Validate only
asd -w profile.json                 # Watch mode with Chrome live reload
asd merge <base.json> <partial.json> # Merge ALPS documents
```

## Architecture

### Monorepo Structure (pnpm workspaces)

```
packages/
├── app-state-diagram/  # @alps-asd/app-state-diagram - Main CLI tool
├── mcp/                # @alps-asd/mcp - MCP Server for AI integration
└── crawler/            # @alps-asd/crawler (private) - Website crawler for ALPS extraction
```

MCP server depends on the CLI package via `"@alps-asd/app-state-diagram": "workspace:*"` and imports its parser/validator/generator through subpath exports.

### Data Flow Pipeline

```
Input (JSON/XML)
  → parseAlpsAuto()           # Auto-detect format, parse to AlpsDocument
  → FileResolver.resolve()    # Fetch external href references (file/HTTP)
  → AlpsMerger.merge()        # Optional: combine partial profiles
  → Generator                 # One of:
      ├── generateDot()       # Graphviz DOT
      ├── generateMermaid()   # Mermaid classDiagram
      ├── dotToSvg()          # SVG via WASM (@viz-js/viz) or local `dot` command
      └── generateHtml()      # Interactive HTML with embedded Viz.js
```

### DOT Generation Algorithm (`dot-generator.ts`)

State transitions are derived from the ALPS descriptor tree:

1. **Transitions**: Descriptors with both `type` (safe/unsafe/idempotent) and `rt` (return type)
2. **States**: Descriptors whose `id` appears as an `rt` target
3. **Edges**: Source state → target state, determined by parent-child nesting of descriptors
4. **Colors**: safe=#00A86B (green), unsafe=#FF4136 (red), idempotent=#D4A000 (gold)

The HTML generator duplicates DOT generation logic in embedded JavaScript for browser-side label switching (id ↔ title).

### SVG Generation

Prefers local `dot` command (better multibyte support), falls back to WASM-based @viz-js/viz.

### Validation Codes

- **Errors (E001-E011)**: Missing id/href, missing rt, invalid type, broken references, duplicate ids
- **Warnings (W001-W004)**: Missing title, naming conventions (go*/do* prefixes), orphan descriptors
- **Suggestions (S001-S003)**: Documentation improvements

### Build Configuration

- TypeScript target: ES2020, module: CommonJS
- Each package has `tsconfig.json` extending `tsconfig.base.json`
- Output to `dist/` directory

### CI

- GitHub Actions on `2.x` branch
- Node.js 20 & 22 matrix
- Tests + coverage (Codecov) + demo output generation + DOT validation with Graphviz

## Descriptor Types

| Type | Color | Naming Convention |
|------|-------|-------------------|
| semantic | White | - |
| safe | #00A86B | `goXxx` |
| unsafe | #FF4136 | `doXxx` |
| idempotent | #D4A000 | `doXxx` |
