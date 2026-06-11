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
import * as zlib from "zlib";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const ALPS_EDITOR_URL_PREFIX = "https://editor.app-state-diagram.com/#profile=";
const URL_LENGTH_WARNING_THRESHOLD = 32000;

// Import from CLI package
import { parseAlpsAuto, docText, findDescriptorById, walkDescriptors } from "@alps-asd/app-state-diagram/parser/alps-parser.js";
import type { AlpsDocument, AlpsDescriptor } from "@alps-asd/app-state-diagram/parser/alps-parser.js";
import { AlpsValidator } from "@alps-asd/app-state-diagram/validator/index.js";
import { generateDot } from "@alps-asd/app-state-diagram/generator/dot-generator.js";
import { dotToSvg } from "@alps-asd/app-state-diagram/generator/svg-generator.js";
import { generateMermaid } from "@alps-asd/app-state-diagram/generator/mermaid-generator.js";
import { FileResolver } from "@alps-asd/app-state-diagram/resolver/index.js";
import { extractGraph, findPaths, formatPath, findContainers, getDescriptorIdsByTags } from "@alps-asd/app-state-diagram/graph/index.js";
import { addDescriptor, setDescriptorTags, renameDescriptor } from "./descriptor-store.js";
import { setDescriptorDoc, resolveDoc, resolveSafeLocalPath, INLINE_DOC_MAX_LENGTH } from "./doc-store.js";
import { loadTagVocabulary } from "./tag-vocabulary.js";

// Crawler package is optional (not yet published)
// import { AlpsCrawler } from "@alps-asd/crawler";

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
            vocabulary: {
              type: "string",
              description:
                "Path to a tag vocabulary file (tags.html with tags as <dt> ids, see docs/tag-vocabulary.md). Tags used in the profile but not defined there are reported as W005 warnings.",
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
            tag: {
              type: "string",
              description: "Filter the diagram to descriptors with these tags (space- or comma-separated). Shows the induced subgraph: tagged nodes plus endpoints of tagged transitions.",
            },
            output: {
              type: "string",
              description: "Write the SVG to this file path and return the path instead of inline SVG (recommended for large diagrams)",
            },
          },
        },
      },
      {
        name: "alps2mermaid",
        description: "Convert ALPS profile to Mermaid classDiagram format (GitHub/VSCode compatible)",
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
            tag: {
              type: "string",
              description: "Filter the diagram to descriptors with these tags (space- or comma-separated). Shows the induced subgraph: tagged nodes plus endpoints of tagged transitions.",
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
        name: "alps_editor_url",
        description: "Create a shareable ALPS Editor URL from an ALPS profile file",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to ALPS profile file (XML or JSON)",
            },
          },
          required: ["file"],
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
      {
        name: "validate_openapi",
        description: "Validate OpenAPI specification using Spectral linter",
        inputSchema: {
          type: "object" as const,
          properties: {
            openapi_content: {
              type: "string",
              description: "OpenAPI specification content (YAML or JSON)",
            },
            openapi_path: {
              type: "string",
              description: "Path to OpenAPI file (alternative to openapi_content)",
            },
          },
        },
      },
      {
        name: "alps_overview",
        description:
          "Summarize an ALPS profile: title, application states, transitions (with from/to states), and tags. Use this first to understand the application state model.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON or XML)",
            },
          },
          required: ["file"],
        },
      },
      {
        name: "alps_search",
        description:
          "Filter descriptors in an ALPS profile by type, tag, and/or free text (matched against id, title, and doc). Returns compact summaries.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON or XML)",
            },
            type: {
              type: "string",
              enum: ["semantic", "safe", "unsafe", "idempotent"],
              description: "Filter by descriptor type",
            },
            tag: {
              type: "string",
              description: "Filter by tag(s), space- or comma-separated (OR match against the descriptor's space-separated tags)",
            },
            text: {
              type: "string",
              description: "Case-insensitive text search in id, title, and doc",
            },
            format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Output format: json (default) or a Markdown table (ID, Type, Title, Tags, Doc) for direct display in chat",
            },
          },
          required: ["file"],
        },
      },
      {
        name: "alps_tags",
        description:
          "List the tags in use across an ALPS profile, grouped by facet (actor/flow/feature/src/page prefix, else domain) with usage counts. Given a vocabulary file (tags.html, see docs/tag-vocabulary.md), each tag is joined with its definition (defined, title).",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON or XML)",
            },
            vocabulary: {
              type: "string",
              description: "Path to a tag vocabulary file (tags.html with tags as <dt> ids, see docs/tag-vocabulary.md)",
            },
            format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Output format: json (default) or a Markdown table (Tag, Facet, Count, Defined, Title) for direct display in chat",
            },
          },
          required: ["file"],
        },
      },
      {
        name: "alps_descriptor",
        description:
          "Get full details of one descriptor: definition, resolved documentation and rel=\"describedby\" links (local files are read and inlined; http(s) links are returned unresolved), containing states, and incoming/outgoing transitions.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON or XML)",
            },
            id: {
              type: "string",
              description: "Descriptor id",
            },
          },
          required: ["file", "id"],
        },
      },
      {
        name: "alps_paths",
        description:
          "Enumerate transition paths from one application state to another, e.g. all ways a user can get from Home to OrderConfirmation.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON or XML)",
            },
            from: {
              type: "string",
              description: "Starting state id",
            },
            to: {
              type: "string",
              description: "Target state id",
            },
            maxPaths: {
              type: "number",
              minimum: 1,
              maximum: 50,
              description: "Maximum paths (default 10)",
            },
          },
          required: ["file", "from", "to"],
        },
      },
      {
        name: "alps_set_doc",
        description:
          "Set or update the documentation of a descriptor in a JSON ALPS profile. " +
          `Short single-line docs (<= ${INLINE_DOC_MAX_LENGTH} chars) are stored inline; ` +
          "longer or multi-line docs are automatically written to an external Markdown " +
          "file (alps/docs/<id>.md) and linked from the profile via doc.href. This keeps " +
          "the profile compact, so feel free to write rich, detailed Markdown " +
          "documentation describing the meaning of the state and related information.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON or XML)",
            },
            id: {
              type: "string",
              description: "Descriptor id",
            },
            doc: {
              type: "string",
              description: "Documentation text (Markdown welcome for external docs)",
            },
            placement: {
              type: "string",
              enum: ["auto", "inline", "external"],
              description: "Storage placement (default: auto - the server decides by size)",
            },
          },
          required: ["file", "id", "doc"],
        },
      },
      {
        name: "alps_add_descriptor",
        description: "Add a new descriptor to a JSON ALPS profile. Containers reference children via href fragments; missing children are created as top-level semantic descriptors. Example: register name and age as person -> id: person, children: [name, age].",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON only for writes)",
            },
            id: {
              type: "string",
              description: "New descriptor id",
            },
            type: {
              type: "string",
              enum: ["semantic", "safe", "unsafe", "idempotent"],
              description: "Descriptor type (default: semantic)",
            },
            title: {
              type: "string",
              description: "Human-readable title",
            },
            doc: {
              type: "string",
              description: "Documentation; long or multi-line docs are auto-externalized to alps/docs/<id>.md",
            },
            rt: {
              type: "string",
              description: "Transition target state id (for safe/unsafe/idempotent); bare ids are normalized to #fragments",
            },
            tag: {
              type: "string",
              description: "Space-separated tags",
            },
            children: {
              type: "array",
              items: { type: "string" },
              description: "Child descriptor ids, referenced as href fragments; missing ones are created as semantic leaf descriptors",
            },
            parent: {
              type: "string",
              description: "Nest the new descriptor inside this existing descriptor (default: top level)",
            },
          },
          required: ["file", "id"],
        },
      },
      {
        name: "alps_set_tags",
        description:
          "Add and/or remove tags in a descriptor's space-separated tag attribute in a JSON ALPS profile. Kept tags preserve their order, new tags are appended, and the tag property is removed when it becomes empty.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON only for writes)",
            },
            id: {
              type: "string",
              description: "Descriptor id",
            },
            add: {
              type: "array",
              items: { type: "string" },
              description: "Tags to add (ones already present are ignored)",
            },
            remove: {
              type: "array",
              items: { type: "string" },
              description: "Tags to remove (at least one of add/remove is required)",
            },
          },
          required: ["file", "id"],
        },
      },
      {
        name: "alps_rename",
        description:
          "Rename a descriptor in a JSON ALPS profile and update all local references: href and rt #fragments at any nesting depth. External references (file.json#id) are left untouched. An external doc file (doc.href) keeps its old file name but stays linked.",
        inputSchema: {
          type: "object" as const,
          properties: {
            file: {
              type: "string",
              description: "Path to the ALPS profile file (JSON only for writes)",
            },
            id: {
              type: "string",
              description: "Current descriptor id",
            },
            newId: {
              type: "string",
              description: "New descriptor id",
            },
          },
          required: ["file", "id", "newId"],
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
    case "alps2mermaid":
      return handleAlps2Mermaid(args);
    case "alps_guide":
      return handleAlpsGuide();
    case "alps_editor_url":
      return handleAlpsEditorUrl(args);
    case "crawl_and_extract_alps":
      return handleCrawlAndExtract(args);
    case "validate_openapi":
      return handleValidateOpenapi(args);
    case "alps_overview":
      return handleAlpsOverview(args);
    case "alps_search":
      return handleAlpsSearch(args);
    case "alps_tags":
      return handleAlpsTags(args);
    case "alps_descriptor":
      return handleAlpsDescriptor(args);
    case "alps_paths":
      return handleAlpsPaths(args);
    case "alps_set_doc":
      return handleAlpsSetDoc(args);
    case "alps_add_descriptor":
      return handleAlpsAddDescriptor(args);
    case "alps_set_tags":
      return handleAlpsSetTags(args);
    case "alps_rename":
      return handleAlpsRename(args);
    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

export async function handleValidateAlps(args: Record<string, unknown> | undefined) {
  const alpsContent = args?.alps_content as string | undefined;
  const vocabularyPath = args?.vocabulary as string | undefined;

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

    // Check used tags against the vocabulary file (docs/tag-vocabulary.md)
    let unusedDefinedTags: string[] = [];
    if (vocabularyPath) {
      const vocabulary = loadTagVocabulary(vocabularyPath);
      const usedTags = new Set<string>();
      for (const desc of allDescriptors(document)) {
        descriptorTags(desc).forEach((tag) => usedTags.add(tag));
      }
      for (const tag of [...usedTags].sort()) {
        if (!vocabulary.has(tag)) {
          result.warnings.push({
            code: "W005",
            severity: "warning",
            message: `Unknown tag "${tag}" (not defined in ${vocabularyPath})`,
          });
        }
      }
      unusedDefinedTags = [...vocabulary.keys()].filter((tag) => !usedTags.has(tag)).sort();
    }

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

    if (unusedDefinedTags.length > 0) {
      lines.push(`**Defined but unused tags** (${vocabularyPath}): ${unusedDefinedTags.join(", ")}`);
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
    /* istanbul ignore next */
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

export function createAlpsEditorUrl(alpsContent: string): string {
  const encoded = zlib.deflateRawSync(Buffer.from(alpsContent, "utf-8")).toString("base64url");
  return `${ALPS_EDITOR_URL_PREFIX}${encoded}`;
}

export async function handleAlpsEditorUrl(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;

  if (!file) {
    return {
      content: [{ type: "text", text: "Error: file is required" }],
      isError: true,
    };
  }

  let alpsContent: string;
  try {
    alpsContent = fs.readFileSync(file, "utf-8");
  } catch {
    return {
      content: [{ type: "text", text: `Error: Cannot read file: ${file}` }],
      isError: true,
    };
  }

  const url = createAlpsEditorUrl(alpsContent);
  const lines = [
    "✅ ALPS Editor URL generated",
    "",
    url,
  ];

  if (url.length > URL_LENGTH_WARNING_THRESHOLD) {
    lines.push(
      "",
      `Note: Browsers can open this URL, but Slack and similar tools may break it (URL length: ${url.length} characters).`
    );
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
    isError: false,
  };
}

/**
 * Add a new descriptor (optionally nested or with href children) to a JSON profile
 */
export async function handleAlpsAddDescriptor(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const id = args?.id as string | undefined;
  if (!file || !id) {
    return {
      content: [{ type: "text", text: "Error: file and id are required" }],
      isError: true,
    };
  }
  try {
    // Snapshot for rollback so a doc failure cannot leave a partial update
    const absPath = path.resolve(file);
    const original = fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf-8") : null;
    const result = addDescriptor(file, {
      id,
      type: args?.type as "semantic" | "safe" | "unsafe" | "idempotent" | undefined,
      title: args?.title as string | undefined,
      rt: args?.rt as string | undefined,
      tag: args?.tag as string | undefined,
      children: args?.children as string[] | undefined,
      parent: args?.parent as string | undefined,
    });
    const doc = args?.doc as string | undefined;
    let docResult: unknown;
    if (doc) {
      try {
        docResult = setDescriptorDoc(file, id, doc, "auto");
      } catch (docError) {
        if (original !== null) {
          fs.writeFileSync(absPath, original, "utf-8");
        }
        throw docError;
      }
    }
    return jsonResult({ ...result, ...(docResult ? { doc: docResult } : {}) });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Add and/or remove tags on a descriptor in a JSON profile
 */
export async function handleAlpsSetTags(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const id = args?.id as string | undefined;
  if (!file || !id) {
    return {
      content: [{ type: "text", text: "Error: file and id are required" }],
      isError: true,
    };
  }
  try {
    const result = setDescriptorTags(file, {
      id,
      add: args?.add as string[] | undefined,
      remove: args?.remove as string[] | undefined,
    });
    return jsonResult(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Rename a descriptor and update local #fragment references across a JSON profile
 */
export async function handleAlpsRename(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const id = args?.id as string | undefined;
  const newId = args?.newId as string | undefined;
  if (!file || !id || !newId) {
    return {
      content: [{ type: "text", text: "Error: file, id, and newId are required" }],
      isError: true,
    };
  }
  try {
    return jsonResult(renameDescriptor(file, id, newId));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Render descriptor summaries as a Markdown table for chat display
 */
function descriptorsToMarkdownTable(
  rows: Array<{ id?: string; type: string; title?: string; tags?: string[]; doc?: string }>
): string {
  if (rows.length === 0) {
    return "No descriptors match.";
  }
  const escapeCell = (value: string): string => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [
    "| ID | Type | Title | Tags | Doc |",
    "| :-- | :-- | :-- | :-- | :-- |",
  ];
  for (const row of rows) {
    lines.push(
      `| ${escapeCell(row.id || "")} | ${row.type} | ${escapeCell(row.title || "")} | ${escapeCell((row.tags || []).join(" "))} | ${escapeCell(row.doc || "")} |`
    );
  }
  return lines.join("\n");
}

/**
 * Resolve the optional tag filter for diagram tools.
 * Returns null when no tags are requested.
 */
function resolveTagFilter(
  document: AlpsDocument,
  tagParam: string | undefined
): { filterIds: Set<string> | null; error?: string } {
  if (!tagParam) {
    return { filterIds: null };
  }
  const tags = tagParam.split(/[\s,]+/).filter(Boolean);
  if (tags.length === 0) {
    return { filterIds: null };
  }
  const filterIds = getDescriptorIdsByTags(document, tags);
  if (filterIds.size === 0) {
    return { filterIds, error: `No descriptors match tag(s): ${tags.join(", ")}` };
  }
  return { filterIds };
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
    const { filterIds, error } = resolveTagFilter(document, args?.tag as string | undefined);
    if (error) {
      return { content: [{ type: "text", text: error }], isError: true };
    }
    const dot = generateDot(document, "id", filterIds);
    if (!dot) {
      return { content: [{ type: "text", text: "No diagram nodes match the selected tags." }] };
    }
    const svg = await dotToSvg(dot);

    const output = args?.output as string | undefined;
    if (output) {
      const outPath = path.resolve(output);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, svg, "utf-8");
      return {
        content: [{ type: "text", text: `✅ SVG written to ${outPath} (${svg.length} bytes)` }],
      };
    }

    return {
      content: [{ type: "text", text: `✅ SVG generated (${svg.length} bytes)\n\n\`\`\`svg\n${svg}\n\`\`\`` }],
      isError: false,
    };
  } catch (error) {
    /* istanbul ignore next */
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

export async function handleAlps2Mermaid(args: Record<string, unknown> | undefined) {
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
    const { filterIds, error } = resolveTagFilter(document, args?.tag as string | undefined);
    if (error) {
      return { content: [{ type: "text", text: error }], isError: true };
    }
    const mermaid = generateMermaid(document, filterIds);
    if (!mermaid) {
      return { content: [{ type: "text", text: "No diagram nodes match the selected tags." }] };
    }

    return {
      content: [{ type: "text", text: `✅ Mermaid classDiagram generated\n\n\`\`\`mermaid\n${mermaid}\`\`\`` }],
      isError: false,
    };
  } catch (error) {
    /* istanbul ignore next */
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
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

export async function handleValidateOpenapi(args: Record<string, unknown> | undefined) {
  let openapiContent = args?.openapi_content as string | undefined;
  const openapiPath = args?.openapi_path as string | undefined;

  // If path provided, read file
  if (openapiPath && !openapiContent) {
    try {
      openapiContent = fs.readFileSync(openapiPath, "utf-8");
    } catch {
      return {
        content: [{ type: "text", text: `Error: Cannot read file: ${openapiPath}` }],
        isError: true,
      };
    }
  }

  if (!openapiContent) {
    return {
      content: [{ type: "text", text: "Error: openapi_content or openapi_path is required" }],
      isError: true,
    };
  }

  // Write to temp file for Spectral
  const tempFile = path.join("/tmp", `openapi-${Date.now()}.yaml`);

  try {
    fs.writeFileSync(tempFile, openapiContent, "utf-8");

    // Run Spectral
    const { stdout, stderr } = await execAsync(
      `npx @stoplight/spectral-cli lint "${tempFile}" --format text`,
      { timeout: 60000 }
    );

    // Clean up temp file
    fs.unlinkSync(tempFile);

    /* istanbul ignore next -- stderr fallback for edge cases */
    const output = stdout || stderr;

    // Check if validation passed
    /* istanbul ignore next -- empty output is rare but valid success case */
    if (output.includes("No results with a severity of") || output.trim() === "") {
      return {
        content: [{ type: "text", text: "✅ OpenAPI Validation SUCCESSFUL\n\nNo errors or warnings found." }],
        isError: false,
      };
    }

    // Parse output for errors/warnings
    /* istanbul ignore next -- ✖ is alternative error marker */
    const hasErrors = output.includes("error") || output.includes("✖");

    return {
      content: [{
        type: "text",
        text: hasErrors
          ? `❌ OpenAPI Validation FAILED\n\n${output}`
          : `⚠️ OpenAPI Validation completed with warnings\n\n${output}`
      }],
      isError: hasErrors,
    };
  } catch (error) {
    // Clean up temp file on error
    try {
      fs.unlinkSync(tempFile);
    } catch {
      /* istanbul ignore next -- cleanup errors are safely ignored */
    }

    /* istanbul ignore next -- non-Error throws are rare */
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Spectral returns non-zero exit code on validation errors
    // Check if it's actual validation output
    if (errorMessage.includes("error") || errorMessage.includes("warning")) {
      /* istanbul ignore next -- ✖ is alternative error marker */
      const hasErrors = errorMessage.includes("error") || errorMessage.includes("✖");
      return {
        content: [{
          type: "text",
          text: hasErrors
            ? `❌ OpenAPI Validation FAILED\n\n${errorMessage}`
            : `⚠️ OpenAPI Validation completed with warnings\n\n${errorMessage}`
        }],
        isError: hasErrors,
      };
    }

    return {
      content: [{ type: "text", text: `Error running Spectral: ${errorMessage}` }],
      isError: true,
    };
  }
}

const DOC_PREVIEW_LENGTH = 80;

interface LoadedProfile {
  document: AlpsDocument;
  baseDir: string;
}

/**
 * Read, parse, and resolve an ALPS profile from disk.
 * Always reads fresh so edits between tool calls are visible.
 */
async function loadProfile(file: string): Promise<LoadedProfile> {
  const absPath = path.resolve(file);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Profile file not found: ${file}`);
  }
  const content = fs.readFileSync(absPath, "utf-8");
  const baseDir = path.dirname(absPath);
  const parsed = parseAlpsAuto(content);
  const resolver = new FileResolver(baseDir);
  const document = await resolver.resolve(parsed);
  return { document, baseDir };
}

/**
 * Split the space-separated tag attribute into a list
 */
function descriptorTags(desc: AlpsDescriptor): string[] {
  return (desc.tag || "").split(/\s+/).filter(Boolean);
}

/**
 * Short doc excerpt for search results; external docs show their href
 */
function docPreview(desc: AlpsDescriptor): string | undefined {
  const text = docText(desc.doc);
  if (!text) {
    const href = typeof desc.doc === "object" ? desc.doc?.href : undefined;
    return href ? `(external: ${href})` : undefined;
  }
  return text.length > DOC_PREVIEW_LENGTH ? `${text.slice(0, DOC_PREVIEW_LENGTH)}…` : text;
}

/**
 * Compact descriptor summary returned by alps_search
 */
function summarize(desc: AlpsDescriptor) {
  const tags = descriptorTags(desc);
  const doc = docPreview(desc);
  return {
    id: desc.id,
    type: desc.type || "semantic",
    title: desc.title,
    ...(desc.rt ? { rt: desc.rt } : {}),
    ...(tags.length ? { tags } : {}),
    ...(doc ? { doc } : {}),
  };
}

/**
 * Collect all descriptors (top-level and nested) in document order
 */
function allDescriptors(document: AlpsDocument): AlpsDescriptor[] {
  const result: AlpsDescriptor[] = [];
  walkDescriptors(document.alps.descriptor || [], (desc) => result.push(desc));
  return result;
}

/**
 * Tool result with pretty-printed JSON content
 */
function jsonResult(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    isError: false,
  };
}

export async function handleAlpsOverview(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;

  if (!file) {
    return {
      content: [{ type: "text", text: "Error: file is required" }],
      isError: true,
    };
  }

  try {
    const { document } = await loadProfile(file);
    const descriptors = allDescriptors(document);
    const graph = extractGraph(document);
    const tags = new Set<string>();
    for (const desc of descriptors) {
      descriptorTags(desc).forEach((tag) => tags.add(tag));
    }
    return jsonResult({
      title: document.alps.title,
      doc: docText(document.alps.doc) || undefined,
      counts: {
        descriptors: descriptors.length,
        states: graph.states.length,
        transitions: graph.transitions.length,
      },
      states: graph.states.map((s) => ({ id: s.id, title: s.title })),
      transitions: graph.transitions.map((t) => ({
        id: t.id,
        type: t.type,
        from: t.from,
        to: t.to,
      })),
      tags: [...tags].sort(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

export async function handleAlpsSearch(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const type = args?.type as string | undefined;
  const tag = args?.tag as string | undefined;
  const text = args?.text as string | undefined;

  if (!file) {
    return {
      content: [{ type: "text", text: "Error: file is required" }],
      isError: true,
    };
  }

  try {
    const { document } = await loadProfile(file);
    const descriptors = allDescriptors(document);
    const needle = text?.toLowerCase();
    const tagList = tag ? tag.split(/[\s,]+/).filter(Boolean) : [];
    const tagSet = tagList.length > 0 ? new Set(tagList) : null;
    const matches = descriptors.filter((desc) => {
      if (!desc.id) {
        return false;
      }
      if (type && (desc.type || "semantic") !== type) {
        return false;
      }
      if (tagSet && !descriptorTags(desc).some((t) => tagSet.has(t))) {
        return false;
      }
      if (needle) {
        const haystack = `${desc.id} ${desc.title || ""} ${docText(desc.doc)}`.toLowerCase();
        if (!haystack.includes(needle)) {
          return false;
        }
      }
      return true;
    });
    if ((args?.format as string | undefined) === "markdown") {
      return { content: [{ type: "text", text: descriptorsToMarkdownTable(matches.map(summarize)) }] };
    }
    return jsonResult({ count: matches.length, descriptors: matches.map(summarize) });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

/** Facet prefix registry (docs/tag-vocabulary.md); other tags are domain vocabulary */
const FACET_PREFIXES = ["actor", "flow", "feature", "src", "page"];
const FACET_ORDER = [...FACET_PREFIXES, "domain"];

/**
 * Classify a tag by its facet prefix (the part before the first "-")
 */
function tagFacet(tag: string): string {
  const prefix = tag.split("-", 1)[0];
  return tag.includes("-") && FACET_PREFIXES.includes(prefix) ? prefix : "domain";
}

interface TagUsage {
  tag: string;
  count: number;
  defined?: boolean;
  title?: string;
}

/**
 * Render tag usage as a Markdown table for chat display
 */
function tagsToMarkdownTable(facets: Record<string, TagUsage[]>, hasVocabulary: boolean): string {
  const escapeCell = (value: string): string => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [
    "| Tag | Facet | Count | Defined | Title |",
    "| :-- | :-- | --: | :-- | :-- |",
  ];
  for (const [facet, usages] of Object.entries(facets)) {
    for (const usage of usages) {
      const defined = hasVocabulary ? (usage.defined ? "yes" : "no") : "";
      lines.push(
        `| ${escapeCell(usage.tag)} | ${facet} | ${usage.count} | ${defined} | ${escapeCell(usage.title || "")} |`
      );
    }
  }
  return lines.length === 2 ? "No tags in use." : lines.join("\n");
}

export async function handleAlpsTags(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const vocabularyPath = args?.vocabulary as string | undefined;

  if (!file) {
    return {
      content: [{ type: "text", text: "Error: file is required" }],
      isError: true,
    };
  }

  try {
    const { document } = await loadProfile(file);
    const vocabulary = vocabularyPath ? loadTagVocabulary(vocabularyPath) : undefined;
    const counts = new Map<string, number>();
    for (const desc of allDescriptors(document)) {
      for (const tag of descriptorTags(desc)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const grouped: Record<string, TagUsage[]> = {};
    for (const tag of [...counts.keys()].sort()) {
      const usage: TagUsage = { tag, count: counts.get(tag)! };
      if (vocabulary) {
        usage.defined = vocabulary.has(tag);
        if (usage.defined) {
          usage.title = vocabulary.get(tag);
        }
      }
      (grouped[tagFacet(tag)] ??= []).push(usage);
    }
    const facets: Record<string, TagUsage[]> = {};
    for (const facet of FACET_ORDER) {
      if (grouped[facet]) {
        facets[facet] = grouped[facet];
      }
    }
    if ((args?.format as string | undefined) === "markdown") {
      return { content: [{ type: "text", text: tagsToMarkdownTable(facets, vocabulary !== undefined) }] };
    }
    return jsonResult({ count: counts.size, facets });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Resolve rel="describedby" links on a descriptor. Local files inside the
 * profile directory are read and inlined as text; http(s) and unsafe hrefs
 * are returned unresolved.
 */
function resolveDescribedBy(
  baseDir: string,
  descriptor: AlpsDescriptor
): Array<{ rel: string; href: string; text?: string }> | undefined {
  const link = descriptor.link;
  if (!link) {
    return undefined;
  }
  const links = Array.isArray(link) ? link : [link];
  const describedBy = links.filter((l) => l?.rel === "describedby" && l.href);
  if (describedBy.length === 0) {
    return undefined;
  }
  return describedBy.map((l) => {
    const localPath = resolveSafeLocalPath(baseDir, l.href);
    if (localPath && fs.existsSync(localPath)) {
      return { rel: l.rel, href: l.href, text: fs.readFileSync(localPath, "utf-8") };
    }
    return { rel: l.rel, href: l.href };
  });
}

export async function handleAlpsDescriptor(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const id = args?.id as string | undefined;

  if (!file || !id) {
    return {
      content: [{ type: "text", text: "Error: file and id are required" }],
      isError: true,
    };
  }

  try {
    const { document, baseDir } = await loadProfile(file);
    const descriptors = document.alps.descriptor || [];
    const descriptor = findDescriptorById(descriptors, id);
    if (!descriptor) {
      throw new Error(`Descriptor not found: ${id}`);
    }
    const graph = extractGraph(document);
    return jsonResult({
      descriptor,
      doc: resolveDoc(baseDir, descriptor.doc),
      describedBy: resolveDescribedBy(baseDir, descriptor),
      containedBy: findContainers(id, descriptors),
      outgoingTransitions: graph.transitions
        .filter((t) => t.from.includes(id))
        .map((t) => ({ id: t.id, type: t.type, to: t.to })),
      incomingTransitions: graph.transitions
        .filter((t) => t.to === id)
        .map((t) => ({ id: t.id, type: t.type, from: t.from })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

export async function handleAlpsPaths(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const from = args?.from as string | undefined;
  const to = args?.to as string | undefined;
  const maxPaths = args?.maxPaths as number | undefined;

  if (!file || !from || !to) {
    return {
      content: [{ type: "text", text: "Error: file, from, and to are required" }],
      isError: true,
    };
  }

  try {
    const { document } = await loadProfile(file);
    const graph = extractGraph(document);
    const stateIds = new Set(graph.states.map((s) => s.id));
    for (const state of [from, to]) {
      if (!stateIds.has(state)) {
        throw new Error(`Unknown state: ${state} (known states: ${[...stateIds].join(", ")})`);
      }
    }
    // Clamp to keep enumeration bounded regardless of caller input
    const boundedMaxPaths = Math.min(50, Math.max(1, Math.trunc(maxPaths ?? 10) || 10));
    const paths = findPaths(graph, from, to, boundedMaxPaths);
    return jsonResult({
      from,
      to,
      count: paths.length,
      paths: paths.map((p) => formatPath(from, p)),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}

export async function handleAlpsSetDoc(args: Record<string, unknown> | undefined) {
  const file = args?.file as string | undefined;
  const id = args?.id as string | undefined;
  const doc = args?.doc as string | undefined;
  const placement = args?.placement as "auto" | "inline" | "external" | undefined;

  if (!file || !id || doc === undefined) {
    return {
      content: [{ type: "text", text: "Error: file, id, and doc are required" }],
      isError: true,
    };
  }

  try {
    const result = setDescriptorDoc(file, id, doc, placement ?? "auto");
    return jsonResult(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
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
