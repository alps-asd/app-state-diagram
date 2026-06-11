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
- `vocabulary` (optional): Path to a tag vocabulary file (`tags.html` defining each tag as a `<dt>` id — see [ALPS Tag Vocabulary](../../docs/tag-vocabulary.md)). Tags used in the profile but not defined there are reported as `W005` warnings, and tags defined but never used are listed informationally — so typos surface instead of silently creating new categories.

**Example prompt:**
> "Validate this ALPS profile and tell me if there are any errors"

**Response includes:**
- Errors (E-codes): Must be fixed for valid profile
- Warnings (W-codes): Best practice violations
- Suggestions (S-codes): Optional improvements

### alps2svg

**Parameters:**
- `alps_content` or `alps_path` (required)
- `tag` (optional): Filter to the tagged slice — space/comma-separated tags; shows the induced subgraph (tagged nodes plus endpoints of tagged transitions)
- `output` (optional): Write the SVG to this file path and return the path (recommended for large diagrams)


Generate an SVG state diagram from an ALPS profile.

**Parameters:**
- `alps_content`: ALPS profile content (XML or JSON format)
- `alps_path`: Path to ALPS profile file (alternative to alps_content)

**Example prompt:**
> "Generate a state diagram from my ALPS profile at ./api.json"

### alps2mermaid

Convert ALPS profile to Mermaid classDiagram (renders natively in GitHub, claude.ai artifacts, VS Code).

**Parameters:**
- `alps_content` or `alps_path` (required)
- `tag` (optional): Filter to the tagged slice (same semantics as alps2svg)

**Example prompt:**
> "Show me the checkout flow of profile.json as a diagram"

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
- `tag` (optional): Filter by tag(s), space- or comma-separated (OR match)
- `text` (optional): Case-insensitive text search
- `format` (optional): `json` (default) or `markdown` — a table (ID, Type, Title, Tags, Doc) for direct display in chat

**Example prompt:**
> "List all unsafe transitions tagged checkout in profile.json as a table"

### alps_tags

List the tags in use across a profile, grouped by facet (`actor-`, `flow-`, `feature-`, `src-`, `page-` prefixes; everything else is domain vocabulary) with usage counts. Given a `vocabulary` file ([ALPS Tag Vocabulary](../../docs/tag-vocabulary.md)), each tag is joined with its definition: `defined` and the `<dt>` title.

**Parameters:**
- `file` (required): Path to the ALPS profile file
- `vocabulary` (optional): Path to a tag vocabulary file (`tags.html` defining each tag as a `<dt>` id)
- `format` (optional): `json` (default) or `markdown` — a table (Tag, Facet, Count, Defined, Title) for direct display in chat

**Example prompt:**
> "Which tags does profile.json use, and are they all in the vocabulary?"

### alps_descriptor

Get full details of one descriptor: definition, resolved documentation (external doc files are read and inlined), containing states, and incoming/outgoing transitions. `rel="describedby"` links are returned as `describedBy`; local files inside the profile directory are read and inlined as `text`, while http(s) links are returned unresolved.

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

### alps_add_descriptor

Add a new descriptor to a JSON ALPS profile. Containers reference children via `href` fragments (ALPS best practice); missing children are created as top-level semantic descriptors.

**Parameters:**
- `file` (required), `id` (required)
- `type` (optional): `semantic` (default) | `safe` | `unsafe` | `idempotent`
- `title`, `doc`, `tag` (optional) — long docs auto-externalize to `alps/docs/<id>.md`
- `rt` (optional): transition target; bare ids are normalized to `#fragments`
- `children` (optional): child ids referenced as `href` fragments
- `parent` (optional): nest inside an existing descriptor

**Example prompt:**
> "Register name and age as person"

### alps_set_tags

Add and/or remove tags in a descriptor's space-separated `tag` attribute. Kept tags preserve their order, new tags are appended, and the `tag` property is removed when it becomes empty.

**Parameters:**
- `file` (required): Path to the ALPS profile file (JSON only for writes)
- `id` (required): Descriptor id
- `add` (optional): Tags to add (ones already present are ignored)
- `remove` (optional): Tags to remove (at least one of `add`/`remove` is required)

**Example prompt:**
> "Tag the Cart and Checkout states with checkout"

### alps_rename

Rename a descriptor and update all local references across the profile: `href` and `rt` `#fragments` at any nesting depth. Only exact-id matches are rewritten; external references (`file.json#id`) are left untouched. An external doc file (`doc.href`) keeps its old file name — the result reports it as `docFile`; it stays linked and keeps working since the href still points at it.

**Parameters:**
- `file` (required): Path to the ALPS profile file (JSON only for writes)
- `id` (required): Current descriptor id
- `newId` (required): New descriptor id

**Example prompt:**
> "Rename Cart to ShoppingCart everywhere"

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
| W005 | Warning | Tag not defined in the vocabulary file |
| S001 | Suggestion | Consider adding doc to transition |

See [Validation Reference](../../dev-docs/validation-reference.md) for detailed explanations.

## Dependencies

- [@modelcontextprotocol/sdk](https://github.com/anthropics/mcp-sdk) - MCP SDK
- [@alps-asd/app-state-diagram](https://www.npmjs.com/package/@alps-asd/app-state-diagram) - ALPS parser, validator, and generator

## License

MIT
