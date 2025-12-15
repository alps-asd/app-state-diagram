#!/usr/bin/env node
/**
 * ALPS MCP Server
 *
 * Exposes ALPS tools via Model Context Protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Import from CLI package
import { parseAlpsAuto } from "@alps-asd/cli/parser/alps-parser.js";
import { AlpsValidator } from "@alps-asd/cli/validator/index.js";
import { generateDot } from "@alps-asd/cli/generator/dot-generator.js";
import { dotToSvg } from "@alps-asd/cli/generator/svg-generator.js";

// Import from Crawler package
import { AlpsCrawler } from "@alps-asd/crawler";

// moduleDir is only needed at runtime for reading SKILL.md
// In tests, we'll use the embedded guide fallback
// Use eval to defer import.meta parsing so TypeScript doesn't complain in CommonJS mode
function getDirname(): string {
  try {
    // eslint-disable-next-line no-eval
    return path.dirname(fileURLToPath(eval('import.meta.url')));
  } catch {
    return '';
  }
}
const moduleDir = getDirname();

const server = new Server(
  {
    name: "alps-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
/* istanbul ignore next -- MCP framework handler not testable in unit tests */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "validate_alps",
        description: "Validate ALPS profile and provide detailed error feedback",
        inputSchema: {
          type: "object" as const,
          properties: {
            alps_content: {
              type: "string",
              description: "ALPS profile XML or JSON content to validate",
            },
          },
          required: ["alps_content"],
        },
      },
      {
        name: "alps2svg",
        description: "Convert ALPS profile to SVG state diagram",
        inputSchema: {
          type: "object" as const,
          properties: {
            alps_content: {
              type: "string",
              description: "ALPS profile content (XML or JSON format)",
            },
            alps_path: {
              type: "string",
              description: "Path to ALPS profile file (alternative to alps_content)",
            },
          },
        },
      },
      {
        name: "alps_guide",
        description: "Get ALPS best practices and reference guide",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "crawl_and_extract_alps",
        description: "Crawl website and extract ALPS profile using efficient pattern-based analysis",
        inputSchema: {
          type: "object" as const,
          properties: {
            url: {
              type: "string",
              description: "Starting URL to crawl (e.g., https://example.com)",
            },
            max_depth: {
              type: "number",
              description: "Maximum crawl depth (default: 3)",
            },
            exclude_patterns: {
              type: "array",
              description: "URL patterns to exclude (regex strings)",
              items: {
                type: "string",
              },
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

// Handle tool calls
/* istanbul ignore next -- MCP framework handler not testable in unit tests */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "validate_alps":
      return handleValidateAlps(args);
    case "alps2svg":
      return handleAlps2Svg(args);
    case "alps_guide":
      return handleAlpsGuide();
    case "crawl_and_extract_alps":
      return handleCrawlAndExtract(args);
    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

export async function handleValidateAlps(args: Record<string, unknown> | undefined) {
  const alpsContent = args?.alps_content as string | undefined;

  if (!alpsContent) {
    return {
      content: [{ type: "text", text: "Error: alps_content is required" }],
      isError: true,
    };
  }

  try {
    const document = parseAlpsAuto(alpsContent);
    const validator = new AlpsValidator();
    const result = validator.validate(document);

    const lines: string[] = [];

    if (result.isValid) {
      lines.push("✅ ALPS Validation SUCCESSFUL\n");
    } else {
      lines.push("❌ ALPS Validation FAILED\n");
    }

    if (result.errors.length > 0) {
      lines.push("**Errors:**");
      for (const e of result.errors) {
        lines.push(`- [${e.code}] ${e.message}`);
      }
      lines.push("");
    }

    if (result.warnings.length > 0) {
      lines.push("**Warnings:**");
      for (const w of result.warnings) {
        lines.push(`- [${w.code}] ${w.message}`);
      }
      lines.push("");
    }

    if (result.suggestions.length > 0) {
      lines.push(`**Suggestions:** ${result.suggestions.length} items`);
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
      isError: !result.isValid,
    };
  } catch (error) {
    return {
      /* istanbul ignore next */
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : error}` }],
      isError: true,
    };
  }
}

export async function handleAlps2Svg(args: Record<string, unknown> | undefined) {
  let alpsContent = args?.alps_content as string | undefined;
  const alpsPath = args?.alps_path as string | undefined;

  if (alpsPath && !alpsContent) {
    try {
      alpsContent = fs.readFileSync(alpsPath, "utf-8");
    } catch {
      return {
        content: [{ type: "text", text: `Error: Cannot read file: ${alpsPath}` }],
        isError: true,
      };
    }
  }

  if (!alpsContent) {
    return {
      content: [{ type: "text", text: "Error: alps_content or alps_path is required" }],
      isError: true,
    };
  }

  try {
    const document = parseAlpsAuto(alpsContent);
    const dot = generateDot(document);
    const svg = await dotToSvg(dot);

    return {
      content: [{ type: "text", text: `✅ SVG generated (${svg.length} bytes)\n\n\`\`\`svg\n${svg}\n\`\`\`` }],
      isError: false,
    };
  } catch (error) {
    return {
      /* istanbul ignore next */
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : error}` }],
      isError: true,
    };
  }
}

export function handleAlpsGuide() {
  // Try to read SKILL.md
  const skillPath = path.resolve(moduleDir, "../../../.claude/skills/alps/SKILL.md");

  let guide: string;
  try {
    guide = fs.readFileSync(skillPath, "utf-8");
    // Remove YAML frontmatter
    /* istanbul ignore next -- SKILL.md not available in test environment */
    guide = guide.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  } catch {
    guide = getEmbeddedGuide();
  }

  return {
    content: [{ type: "text", text: guide }],
    isError: false,
  };
}

export function getEmbeddedGuide(): string {
  return `# ALPS Best Practices

## Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Safe transition | \`go\` | \`goProductList\`, \`goHome\` |
| Unsafe transition | \`do\` | \`doCreateUser\`, \`doAddToCart\` |
| State/Page | PascalCase | \`HomePage\`, \`ProductDetail\` |

## Three Layers

1. **Ontology** - Semantic descriptors (data fields)
2. **Taxonomy** - State descriptors (screens/pages)
3. **Choreography** - Transition descriptors (safe/unsafe/idempotent)

## Important Rules

- Safe transitions (go*) MUST include target state name
- Tags are space-separated strings, not arrays
- Always validate after generation`;
}

export async function handleCrawlAndExtract(args: Record<string, unknown> | undefined) {
  const url = args?.url as string | undefined;
  const maxDepth = (args?.max_depth as number | undefined) ?? 3;
  const excludePatterns = (args?.exclude_patterns as string[] | undefined) ?? [];

  if (!url) {
    return {
      content: [{ type: "text", text: "Error: url is required" }],
      isError: true,
    };
  }

  try {
    // Note: This is a simplified implementation
    // Full AI-powered extraction requires integration with Claude API
    // For now, we return an error message explaining the limitation

    return {
      content: [{
        type: "text",
        text: `❌ crawl_and_extract_alps is not yet fully implemented in MCP server.

**Reason**: This tool requires AI calls to analyze DOM structure and generate ALPS descriptors, which cannot be done directly within the MCP server context.

**Workaround**: Use the ALPS skill instead, which can leverage AI capabilities:
1. Activate the ALPS skill
2. Request: "Crawl ${url} and generate ALPS profile"
3. The skill will use the crawler library with AI integration

**Alternative**: Use the CLI tool directly once implemented:
\`\`\`bash
asd crawl ${url} --output profile.json --max-depth ${maxDepth}
\`\`\`

**Implementation status**:
✅ URL pattern classifier
✅ DOM skeleton extractor
✅ ALPS descriptor generator (AI prompt)
⏳ MCP integration (requires AI call capability)
⏳ CLI command
⏳ ALPS skill integration`
      }],
      isError: true,
    };
  } catch (error) {
    /* istanbul ignore next */
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : error}` }],
      isError: true,
    };
  }
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
