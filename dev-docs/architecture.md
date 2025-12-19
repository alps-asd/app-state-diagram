# Architecture

This document describes the architecture of app-state-diagram.

## Design Philosophy

**Editor-first, CLI as adapter**: The browser-based editor (`/public/`) is the source of truth for all UI logic. The CLI (`/packages/app-state-diagram/`) is a Node.js adapter that provides command-line access using the same algorithms.

## Project Structure

```
app-state-diagram/
├── public/                     # Browser-based editor (GitHub Pages)
│   ├── index.html              # Main editor page
│   └── js/
│       ├── scripts.js          # Editor UI (Ace, validation)
│       ├── diagramAdapters.js  # DOT/SVG/HTML generation
│       └── descriptor2table.js # Table generation utilities
│
├── packages/
│   └── cli/                    # @alps-asd/cli (Node.js)
│       └── src/
│           ├── asd.ts          # CLI entry point
│           ├── parser/         # ALPS parsing (fast-xml-parser)
│           ├── generator/      # DOT, SVG, HTML generation
│           └── resolver/       # External reference resolution
│
├── docs/
│   ├── architecture.md         # This file
│   └── adr/                    # Architecture Decision Records
│
├── pnpm-workspace.yaml
└── package.json
```

## Package Overview

### /public/ (Browser Editor)

Static site for GitHub Pages. Contains:
- Ace Editor for ALPS JSON/XML editing
- Real-time validation with AJV
- Diagram preview with Viz.js
- Drag & drop file support

### @alps-asd/cli

Node.js CLI tool for generating HTML documentation from ALPS profiles.

Key differences from browser:
- Uses `fast-xml-parser` for XML parsing (browser uses `DOMParser`)
- Uses `@viz-js/viz` (WASM) for SVG generation

## Shared Logic

Both browser and CLI implement the same algorithms:

| Function | Browser (diagramAdapters.js) | CLI (TypeScript) |
|----------|------------------------------|------------------|
| ALPS parsing | DOMParser / JSON.parse | fast-xml-parser / JSON.parse |
| DOT generation | generateDotFromAlps() | dot-generator.ts |
| SVG generation | Viz.js (CDN) | @viz-js/viz (WASM) |
| HTML generation | inline template | html-generator.ts |
| Table generation | descriptor2table.js | table-functions.ts |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALPS Input (JSON/XML)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                  │
           ▼                                                  ▼
┌─────────────────────────┐                    ┌─────────────────────────┐
│  Browser (public/js/)   │                    │   CLI (packages/app-state-diagram/)   │
│  ┌───────────────────┐  │                    │  ┌───────────────────┐  │
│  │ DOMParser (XML)   │  │                    │  │ fast-xml-parser   │  │
│  │ JSON.parse (JSON) │  │                    │  │ JSON.parse        │  │
│  └───────────────────┘  │                    │  └───────────────────┘  │
└─────────────────────────┘                    └─────────────────────────┘
           │                                                  │
           └────────────────────────┬────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │    AlpsDocument Object    │
                    │    (Normalized structure) │
                    └───────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   DOT Generator     │  │   Table Generator   │  │   Link Extractor    │
│   ┌─────────────┐   │  │   ┌─────────────┐   │  │   ┌─────────────┐   │
│   │ States      │   │  │   │ flatten     │   │  │   │ extractLinks│   │
│   │ Transitions │   │  │   │ descriptor  │   │  │   │ generateHtml│   │
│   │ Colors      │   │  │   │ 2table      │   │  │   └─────────────┘   │
│   └─────────────┘   │  │   └─────────────┘   │  └─────────────────────┘
└─────────────────────┘  └─────────────────────┘
           │                        │                        │
           ▼                        │                        │
┌─────────────────────┐             │                        │
│  SVG Generator      │             │                        │
│  (Viz.js WASM)      │             │                        │
└─────────────────────┘             │                        │
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │   Complete HTML Output    │
                    │   • SVG diagram           │
                    │   • Descriptor table      │
                    │   • Label/Size modes      │
                    │   • Tag filtering         │
                    │   • Client-side Viz.js    │
                    └───────────────────────────┘
```

## HTML Output Features

| Feature | Description |
|---------|-------------|
| Label Mode | Radio buttons to switch between ID and Title labels. Regenerates SVG client-side. |
| Size Mode | Original (scrollable) or Fit to width. Auto-selects based on SVG width. |
| Tag Filtering | Checkboxes to highlight descriptors by tag. |
| SVG Navigation | Click nodes/edges to scroll to table row. |
| Table Navigation | Click ID to highlight in SVG. Click rt/Contained to jump. |
| Embedded ALPS | Original ALPS document embedded for client-side regeneration. |

## Descriptor Types

| Type | Color | Naming Convention | Description |
|------|-------|-------------------|-------------|
| semantic | White | - | Data/state descriptors |
| safe | #00A86B (green) | `goXxx` | Read-only transitions (GET) |
| unsafe | #FF4136 (red) | `doXxx` | State-changing transitions (POST) |
| idempotent | #D4A000 (yellow) | `doXxx` | Repeatable state-changing (PUT/DELETE) |

## Dependencies

### @alps-asd/cli
- `fast-xml-parser` - XML parsing
- `@viz-js/viz` - DOT to SVG conversion (WASM)
- `commander` - CLI framework

### Browser Editor
- Ace Editor (CDN) - Code editor
- AJV (CDN) - JSON Schema validation
- Viz.js (CDN) - DOT to SVG conversion
