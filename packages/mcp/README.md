# @alps-asd/mcp

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for ALPS profile development. Provides AI assistants with tools to validate and generate diagrams from ALPS profiles.

## Requirements

- Node.js 20 or higher

## Installation

```bash
npm install @alps-asd/mcp
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "alps": {
      "command": "npx",
      "args": ["@alps-asd/mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "alps": {
      "command": "alps-mcp"
    }
  }
}
```

### Troubleshooting

If you encounter errors, first verify your Node.js version:

```bash
node --version  # Should be v20.0.0 or higher
which npx       # Verify npx is in your PATH
```

If using nvm, ensure the correct version is active:

```bash
nvm use 20
```

## Available Tools

### validate_alps

Validate an ALPS profile and get detailed error feedback.

**Parameters:**
- `alps_content` (required): ALPS profile content (XML or JSON format)

**Example prompt:**
> "Validate this ALPS profile and tell me if there are any errors"

**Response includes:**
- Errors (E-codes): Must be fixed for valid profile
- Warnings (W-codes): Best practice violations
- Suggestions (S-codes): Optional improvements

### alps2svg

Generate an SVG state diagram from an ALPS profile.

**Parameters:**
- `alps_content`: ALPS profile content (XML or JSON format)
- `alps_path`: Path to ALPS profile file (alternative to alps_content)

**Example prompt:**
> "Generate a state diagram from my ALPS profile at ./api.json"

### alps_guide

Get ALPS best practices and reference guide.

**Parameters:** None

**Example prompt:**
> "Show me ALPS best practices for naming transitions"

### alps_overview

Summarize an ALPS profile: title, application states, transitions (with from/to states), and tags. Use this first to understand the application state model.

**Parameters:**
- `file` (required): Path to the ALPS profile file (JSON or XML)

**Example prompt:**
> "Give me an overview of profile.json"

### alps_search

Filter descriptors by type, tag, and/or free text (matched against id, title, and doc). Searches nested descriptors too. Returns compact summaries.

**Parameters:**
- `file` (required): Path to the ALPS profile file
- `type` (optional): `semantic` | `safe` | `unsafe` | `idempotent`
- `tag` (optional): Filter by tag
- `text` (optional): Case-insensitive text search

**Example prompt:**
> "List all unsafe transitions tagged checkout in profile.json"

### alps_descriptor

Get full details of one descriptor: definition, resolved documentation (external doc files are read and inlined), containing states, and incoming/outgoing transitions.

**Parameters:**
- `file` (required): Path to the ALPS profile file
- `id` (required): Descriptor id

**Example prompt:**
> "Show me everything about the Cart descriptor"

### alps_paths

Enumerate transition paths from one application state to another.

**Parameters:**
- `file` (required): Path to the ALPS profile file
- `from` (required): Starting state id
- `to` (required): Target state id
- `maxPaths` (optional): Maximum paths (default 10)

**Example prompt:**
> "How does a user get from Home to OrderConfirmation?"

### alps_set_doc

Set or update the documentation of a descriptor in a JSON ALPS profile. Short single-line docs are stored inline; longer or multi-line docs (Markdown welcome) are automatically written to an external file and linked via `doc.href`.

**Parameters:**
- `file` (required): Path to the ALPS profile file (JSON only for writes)
- `id` (required): Descriptor id
- `doc` (required): Documentation text
- `placement` (optional): `auto` (default) | `inline` | `external`

**Example prompt:**
> "Document the ShoppingCart state with the business rules we discussed"

## Auxiliary Design Information (alps/)

`alps_set_doc` keeps profiles compact: docs over 200 characters or with multiple lines are written to `alps/docs/<descriptor-id>.md` next to the profile and linked via the ALPS `doc` element's `href`:

```json
"doc": { "href": "alps/docs/ShoppingCart.md", "format": "markdown" }
```

The `alps/` directory is the home for all auxiliary design information:

```text
profile.json
alps/
├── docs/    # per-descriptor rich documentation (doc.href targets)
├── rels/    # link relation definitions (reserved)
└── links/   # compacted summaries of external link targets (reserved)
```

Existing local `doc.href` layouts keep working: any safe local href is honored and updated in place. Reading tools resolve these links and inline the file content automatically. Paths escaping the profile directory (absolute, `../`, escaping symlinks) are rejected.

## Example Workflow

1. Ask the AI to validate your ALPS profile:
   > "Validate the ALPS profile in ./my-api.json"

2. Fix any reported errors

3. Generate a diagram:
   > "Create an SVG diagram from ./my-api.json"

4. Get guidance on improvements:
   > "How should I name my transitions in ALPS?"

## Validation Codes

| Code | Severity | Description |
|------|----------|-------------|
| E001 | Error | Missing id or href |
| E002 | Error | Missing rt for transition |
| E003 | Error | Invalid type value |
| E004 | Error | Broken reference |
| E005 | Error | Duplicate id |
| E008 | Error | Missing alps property |
| E009 | Error | Missing descriptor array |
| E011 | Error | Tag must be string |
| W001 | Warning | Missing title |
| W002 | Warning | Safe transition should start with "go" |
| W003 | Warning | Unsafe/idempotent should start with "do" |
| S001 | Suggestion | Consider adding doc to transition |

See [Validation Reference](../../dev-docs/validation-reference.md) for detailed explanations.

## Dependencies

- [@modelcontextprotocol/sdk](https://github.com/anthropics/mcp-sdk) - MCP SDK
- [@alps-asd/app-state-diagram](https://www.npmjs.com/package/@alps-asd/app-state-diagram) - ALPS parser, validator, and generator

## License

MIT
