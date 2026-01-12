# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

app-state-diagram is a TypeScript-based tool that generates visual state diagrams and documentation from ALPS (Application-Level Profile Semantics) profiles. It reads XML or JSON profile files and creates interactive diagrams showing application state transitions.

## Essential Commands

### Build and Testing

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### CLI Usage

```bash
# Generate HTML documentation
asd profile.json
asd profile.xml -o output.html

# Generate SVG diagram
asd profile.json -f svg

# Generate Mermaid classDiagram (GitHub/VSCode compatible)
asd profile.json -f mermaid

# Generate DOT format
asd profile.json -f dot

# Validate only
asd profile.json --validate

# Watch mode with live reload
asd -w profile.json
```

### Package-specific Commands

```bash
# Build specific package
pnpm --filter @alps-asd/cli build
pnpm --filter @alps-asd/mcp build

# Test specific package
pnpm --filter @alps-asd/cli test
pnpm --filter @alps-asd/mcp test
```

## Architecture

### Monorepo Structure

```
packages/
├── cli/          # @alps-asd/cli - Main CLI tool
│   └── src/
│       ├── asd.ts           # CLI entry point
│       ├── parser/          # ALPS JSON/XML parsing
│       ├── validator/       # Validation (E001-E011, W001-W004, S001-S003)
│       ├── generator/       # DOT/SVG/HTML generation
│       └── watch.ts         # Watch mode with Chrome CDP
├── mcp/          # @alps-asd/mcp - MCP Server for AI integration
│   └── src/
│       └── index.ts         # MCP server with validate/generate tools
└── editor/       # alps-editor assets (SSOT for UI)

docs/
└── demo/         # Demo ALPS profiles and generated output
```

### Core Components

**Parser** (`parser/`):
- `alps-parser.ts` - Auto-detects JSON/XML and parses ALPS profiles
- `xml-parser.ts` - XML-specific parsing with fast-xml-parser

**Validator** (`validator/`):
- `alps-validator.ts` - Comprehensive validation
- Errors (E001-E011): Missing id/href, invalid types, broken references
- Warnings (W001-W004): Naming conventions, orphan descriptors
- Suggestions (S001-S003): Documentation improvements

**Generator** (`generator/`):
- `dot-generator.ts` - Generates Graphviz DOT from ALPS
- `mermaid-generator.ts` - Generates Mermaid classDiagram from ALPS
- `html-generator.ts` - Creates HTML with embedded alps-editor
- Uses @viz-js/viz for WASM-based SVG generation

**Watch Mode** (`watch.ts`):
- Chrome auto-launch with remote debugging
- CDP-based live reload on file changes

### MCP Server

Provides AI tools for ALPS development:
- `validate_alps` - Validate ALPS profiles
- `alps2svg` - Generate SVG diagrams
- `alps2mermaid` - Generate Mermaid classDiagram
- `alps_guide` - ALPS best practices guide

## Descriptor Types

| Type | Color | Naming |
|------|-------|--------|
| semantic | White | - |
| safe | #00A86B | `goXxx` |
| unsafe | #FF4136 | `doXxx` |
| idempotent | #D4A000 | `doXxx` |

## Dependencies

- Node.js 20+
- pnpm for workspace management
- @viz-js/viz for Graphviz WASM
- fast-xml-parser for XML parsing
- chrome-remote-interface for CDP
