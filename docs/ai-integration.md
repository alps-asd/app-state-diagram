# Design Application with AI

<img src="ai-integration.png" width="300" alt="AI Integration">


Start a new project with AI-assisted ALPS design:

```bash
mkdir my-app && cd my-app
```

Install (choose one):

```bash
# Homebrew (Recommended)
brew install alps-asd/asd/asd

# Composer (PHP 8.1+)
composer require koriym/app-state-diagram
```

## AI Integration Methods

| Priority | Environment | Method |
|----------|-------------|--------|
| 1st | Claude Code | Skill (recommended) |
| 2nd | Claude Desktop | MCP Server |
| 3rd | Other AI tools | LLM Guide |

## Claude Code (Skill)

```bash
mkdir -p .claude/skills/alps
curl -o .claude/skills/alps/SKILL.md \
  https://raw.githubusercontent.com/alps-asd/app-state-diagram/master/.claude/skills/alps/SKILL.md
```

Then ask Claude Code:
- "Use the alps skill to create an ALPS XML file for a blog system"
- "Validate my alps.xml and fix any issues"

## Claude Desktop (MCP Server)

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "alps": {
      "command": "asd",
      "args": ["--mcp"]
    }
  }
}
```

## Other AI Tools (LLM Guide)

Add to your `AGENTS.md`, `CLAUDE.md`, or system prompt:

```text
@import https://raw.githubusercontent.com/alps-asd/app-state-diagram/master/.claude/skills/alps/SKILL.md
```

Or reference directly: "Use the ALPS guide at https://raw.githubusercontent.com/alps-asd/app-state-diagram/master/.claude/skills/alps/SKILL.md"

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
