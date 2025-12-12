# app-state-diagram

[![codecov](https://codecov.io/gh/alps-asd/app-state-diagram/branch/master/graph/badge.svg?token=FIVDUG18AZ)](https://codecov.io/gh/koriym/app-state-diagram)
[![Type Coverage](https://shepherd.dev/github/alps-asd/app-state-diagram/coverage.svg)](https://shepherd.dev/github/alps-asd/app-state-diagram)
[![Continuous Integration](https://github.com/alps-asd/app-state-diagram/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/continuous-integration.yml)

[![Release (app-state-diagram)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-app-state-diagram.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-app-state-diagram.yml)
[![Release (asd-action)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-asd-action.yml/badge.svg)](https://github.com/alps-asd/app-state-diagram/actions/workflows/release-asd-action.yml)

<img src="https://www.app-state-diagram.com/images/logo.png" width="120px" alt="logo">

**app-state-diagram** is a tool that visualizes state transitions and information structures of RESTful applications. It generates interactive state diagrams and hyperlinked documentation from ALPS (Application-Level Profile Semantics) profiles written in XML or JSON.

[![App State Diagram](https://www.app-state-diagram.com/app-state-diagram/bookstore/alps.svg)](https://www.app-state-diagram.com/app-state-diagram/bookstore/)

## Key Benefits

- **Application Overview**: Visually grasp complex RESTful applications and understand the big picture
- **Clear Information Semantics**: See how data flows and what each element means
- **Enhanced Team Communication**: Both technical and business teams can discuss using the same visual representation
- **Design Consistency**: Represent application structures uniformly and discover design issues early

## Information Architecture Perspective

app-state-diagram embodies the three key aspects of Information Architecture (IA):

- **Ontology**: Defines the semantic meaning of application elements and their relationships
- **Taxonomy**: Organizes information into structured hierarchies and classifications
- **Choreography**: Describes interaction patterns and rules for state transitions

By focusing on these IA principles, app-state-diagram helps create a shared understanding of application semantics across organizational boundaries, independent of specific implementation technologies.

## Quick Start

### Online Editor (No Installation)

- [https://editor.app-state-diagram.com/](https://editor.app-state-diagram.com/)

### Rendering Quality

- **Local Installation**: When Graphviz (`dot` command) is installed locally, app-state-diagram provides high-quality rendering with improved font metrics, especially for Japanese text
- **Online Editor**: Uses JavaScript-based rendering which may have some limitations in font rendering quality
- **Automatic Detection**: The tool automatically detects available rendering engines and uses the best option available

### Install with Homebrew
```bash
brew install alps-asd/asd/asd
```

### Install with Composer

Prerequisites: PHP 8.1+, Composer

```bash
mkdir my-alps && cd my-alps
composer require koriym/app-state-diagram
```

After installation, run:
```bash
asd --watch path/to/your/profile.json
```

### CLI Usage

Basic usage:
```bash
asd path/to/your/profile.json
```

#### Options

- `--mode=html|markdown|svg`: Set output mode (default: html)
  ```bash
  asd --mode=html profile.json      # Generate interactive HTML (default)
  asd --mode=markdown profile.json  # Generate markdown documentation
  asd --mode=svg profile.json       # Generate SVG diagrams for embedding
  ```
  
  **SVG mode** generates two standalone SVG files:
  - `profile.svg` - Main diagram with descriptor IDs
  - `profile.title.svg` - Diagram with human-readable titles
  
  Perfect for embedding in documentation, presentations, or web pages.

- `--watch` or `-w`: Enable watch mode with live browser sync
  ```bash
  asd --watch profile.json          # Start development server
  asd --watch --port=3001 profile.json  # Custom port
  ```

- `--port`: Set development server port (default: 3000, only with `--watch`)
  ```bash
  asd --watch --port=8080 profile.json
  ```

## Examples

See these live demos:

- [Book Store](https://www.app-state-diagram.com/app-state-diagram/bookstore/)
- [LMS](https://www.app-state-diagram.com/app-state-diagram/lms/)

## AI Assistant Integration

Integrate ALPS design guidance into your AI workflow. Choose the method that fits your environment:

| Environment | Recommended | Setup |
|-------------|-------------|-------|
| **Claude Code (CLI)** | Skill | Symlink to project |
| **Claude Desktop / Web** | MCP Server | Configure in settings |
| **Other AI tools** | LLM Guide | Import URL in prompts |

### Option 1: Skill (Claude Code CLI)

Best for natural language ALPS creation and design guidance.

**Prerequisites:** Claude Code 2.0.65 or later

```bash
# Check your Claude Code version
claude --version  # Should be ≥ 2.0.65

# Install skill in your project
mkdir -p .claude/skills/alps
curl -o .claude/skills/alps/SKILL.md \
  https://raw.githubusercontent.com/alps-asd/app-state-diagram/master/.claude/skills/alps/SKILL.md
```

Restart Claude Code, then ask "Show me available skills" to verify installation.

Then ask Claude Code:
- "Create an ALPS profile for an e-commerce site"
- "Validate my ALPS profile at docs/api.json"

### Option 2: MCP Server (Claude Desktop)

For Claude Desktop or environments supporting MCP.

Add to your MCP configuration (`~/.claude.json` or Claude Desktop settings):

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

### Option 3: LLM Guide (Any AI Tool)

For any AI assistant, add this to your project's `AGENTS.md`, `CLAUDE.md`, or system prompt:

```text
@import https://alps-asd.github.io/app-state-diagram/llms-alps-skill.txt
```

Or reference directly in conversations:
- "Use the ALPS guide at <https://alps-asd.github.io/app-state-diagram/llms-alps-skill.txt> to create a profile for..."

## Documentation

For more details, please refer to:
- [Quick Start Guide](https://www.app-state-diagram.com/manuals/1.0/en/quick-start.html)
- [Official Documentation](https://www.app-state-diagram.com/manuals/1.0/en/index.html)
