# ALPS MCP Server

MCP server for ALPS profile validation, SVG diagram generation, and best practices guidance.

## Available Tools

| Tool | Description |
|------|-------------|
| `validate_alps` | Validate ALPS profiles and get detailed error feedback |
| `alps2svg` | Convert ALPS profiles to SVG state diagrams |
| `alps_guide` | Get ALPS best practices and reference guide |

## MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "alps-tools": {
      "command": "asd",
      "args": ["--mcp"]
    }
  }
}
```

> **Tip**: Ask Claude to configure the MCP server for you:
> "Add the alps-tools MCP server using `asd --mcp`"

## Tool Details

### validate_alps

Validates ALPS profile by attempting SVG generation.

```json
{
  "alps_content": "<alps>...</alps>"
}
```

### alps2svg

Converts ALPS profile to SVG diagram.

```json
{
  "alps_content": "<alps>...</alps>",
  "format": "svg"
}
```

Or using file path:

```json
{
  "alps_path": "/path/to/profile.json",
  "format": "both"
}
```

### alps_guide

Returns ALPS best practices from [SKILL.md](../.claude/skills/alps/SKILL.md).
No parameters required.

## ALPS Guide Access by Environment

| Environment | How to Access ALPS Guide |
|-------------|--------------------------|
| Claude Code | Auto-loaded from `.claude/skills/alps/SKILL.md` |
| Claude Desktop / MCP clients | Use `alps_guide` tool |
| Claude.ai chat (no MCP) | Reference GitHub URL below |

### For Chat Environments (No MCP/Skills)

If you're using Claude in a chat environment without MCP or skills support, you can reference the ALPS guide directly:

```
https://github.com/alps-asd/app-state-diagram/blob/master/.claude/skills/alps/SKILL.md
```

Or ask Claude to fetch and follow the guidelines from that URL.

## Testing

```bash
# Test initialize
echo '{"jsonrpc":"2.0","method":"initialize","id":1}' | asd --mcp

# Test tools/list
echo '{"jsonrpc":"2.0","method":"tools/list","id":2}' | asd --mcp

# Test alps_guide
echo '{"jsonrpc":"2.0","method":"tools/call","id":3,"params":{"name":"alps_guide","arguments":{}}}' | asd --mcp
```

## Architecture

```text
┌─────────────────┐    JSON-RPC     ┌──────────────────┐
│   MCP Client    │◄──────────────►│    asd --mcp     │
│ (Claude, etc)   │   STDIN/STDOUT │                  │
└─────────────────┘                 └──────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │ app-state-diagram│
                                   │     library      │
                                   └──────────────────┘
```

## License

MIT
