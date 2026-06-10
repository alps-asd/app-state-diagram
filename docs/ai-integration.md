# Design Application with AI and IA

Start a new project with AI-assisted ALPS design:

```bash
mkdir my-app && cd my-app
```

Install:

```bash
# Homebrew
brew install alps-asd/asd/asd

# npm
npm install -g @alps-asd/cli
```

## AI Integration Methods

| Priority | Environment | Method |
|----------|-------------|--------|
| 1st | Skill clients* | Skill |
| 2nd | MCP clients | MCP Server |
| 3rd | Any LLM | llms.txt / URL Reference |

*Skill clients: [Claude Code](https://claude.ai/code), [OpenAI Codex](https://github.com/openai/codex)

## Skill (Claude Code)

```bash
claude --version  # Requires 1.0.3+

mkdir -p .claude/skills/alps
curl -o .claude/skills/alps/SKILL.md \
  https://raw.githubusercontent.com/alps-asd/app-state-diagram/2.x/.claude/skills/alps/SKILL.md
```

Verify skill is available:
- Ask: "What skills are available?"
- Response should include "alps" skill

Then ask:
- "Use the ALPS skill to create an ALPS JSON file for a blog system"
- "Validate alps.xml and fix any issues"

## MCP Server

### npm Package

```bash
npm install -g @alps-asd/mcp
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### Claude Code

Create `.mcp.json` in your project:

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

Verify: `/mcp` should show "alps" in the list.

### Available Tools

**Convert and validate:**

| Tool | Description |
|------|-------------|
| `validate_alps` | Validate an ALPS profile |
| `alps2svg` | Generate an SVG diagram (`tag` filters to a tagged slice; `output` writes to a file and returns the path) |
| `alps2mermaid` | Generate a Mermaid diagram — renders natively in GitHub, claude.ai, and VS Code (`tag` filters to a tagged slice) |
| `validate_openapi` | Validate an OpenAPI document |
| `crawl_and_extract_alps` | Extract an ALPS draft from a website |
| `alps_guide` | Get ALPS best practices |

**Query and edit profiles:**

| Tool | Description |
|------|-------------|
| `alps_overview` | States, transitions (from/to), and tags at a glance |
| `alps_search` | Filter descriptors by type, tag(s), or text; `format: markdown` returns a table (ID, Type, Title, Tags, Doc) for direct chat display |
| `alps_descriptor` | One descriptor in full — external docs resolved, containers, incoming/outgoing transitions |
| `alps_paths` | Enumerate transition paths between two states |
| `alps_set_doc` | Write descriptor documentation; large docs are auto-externalized to `alps/docs/<id>.md` and linked via `doc.href` |
| `alps_add_descriptor` | Create a new descriptor — nested or with `href` children; missing children are created automatically ("register name and age as person") |

**Tip — view a tagged slice entirely in chat:** ask for `alps2mermaid` with `tag` (the diagram renders natively) plus `alps_search` with the same tags and `format: markdown` (the descriptor table).

## llms.txt (Any LLM)

For LLMs without skill/MCP support, reference these URLs:

| Resource | URL |
|----------|-----|
| Tool Index | https://alps-asd.github.io/app-state-diagram/llms.txt |
| Full Documentation | https://alps-asd.github.io/app-state-diagram/llms-full.txt |
| ALPS Creation Guide | https://alps-asd.github.io/app-state-diagram/alps-skill.md |

Add to your system prompt or AGENTS.md:

```text
For ALPS profile creation, refer to: https://alps-asd.github.io/app-state-diagram/alps-skill.md
```

## Why ALPS First?

ALPS and OpenAPI serve different purposes:

| | ALPS | OpenAPI |
|---|------|---------|
| Focus | **What** (meaning) | **How** (constraints) |
| Role | Vocabulary & semantics | Validation & HTTP details |
| Example | "A post has title, body, tags" | "title: required, max 100 chars" |
| Analogy | Floor plan | Plumbing diagram |

**Benefits of ALPS-first design:**

- **Multi-format**: Generate OpenAPI, GraphQL, gRPC from one ALPS
- **Design purity**: Focus on domain before HTTP details
- **Shared understanding**: Teams discuss concepts, not endpoints
