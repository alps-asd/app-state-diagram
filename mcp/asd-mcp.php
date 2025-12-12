#!/usr/bin/env php
<?php

/**
 * ALPS MCP Server
 *
 * MCP server for ALPS profile validation and SVG diagram generation.
 *
 * Features:
 * - Full JSON-RPC 2.0 compliance
 * - MCP Protocol 2024-11-05 support
 * - ALPS validation with detailed error feedback
 * - ALPS to SVG diagram conversion
 *
 * Usage:
 *   php asd-mcp.php
 *
 * Or via CLI:
 *   asd --mcp
 */

declare(strict_types=1);

use Koriym\AppStateDiagram\Config;
use Koriym\AppStateDiagram\LabelName;
use Koriym\AppStateDiagram\Profile;
use Koriym\AppStateDiagram\PutDiagram;

/*
 * Configuration
 */
const SERVER_NAME = 'alps-tools';
const SERVER_VERSION = '1.0.0';
const MCP_PROTOCOL_VERSION = '2024-11-05';

/**
 * MCP Server Types
 *
 * Complete type definitions for MCP protocol compliance and type safety.
 * These types ensure proper JSON-RPC 2.0 and MCP protocol adherence.
 *
 * @psalm-type McpJsonRpcError = array{
 *     code: int,
 *     message: string
 * }
 * @psalm-type McpServerInfo = array{
 *     name: string,
 *     version: string
 * }
 * @psalm-type McpCapabilities = array{
 *     tools: object
 * }
 * @psalm-type McpInitializeResult = array{
 *     protocolVersion: string,
 *     serverInfo: McpServerInfo,
 *     capabilities: McpCapabilities
 * }
 * @psalm-type McpPropertySchema = array{
 *     type: string,
 *     description?: string,
 *     default?: string,
 *     enum?: list<string>
 * }
 * @psalm-type McpInputSchema = array{
 *     type: string,
 *     properties: object|array<string, McpPropertySchema>,
 *     required?: list<string>
 * }
 * @psalm-type McpTool = array{
 *     name: string,
 *     description: string,
 *     inputSchema: McpInputSchema
 * }
 * @psalm-type McpToolsList = list<McpTool>
 * @psalm-type McpToolsListResult = array{
 *     tools: McpToolsList
 * }
 * @psalm-type McpContent = array{
 *     type: string,
 *     text: string
 * }
 * @psalm-type McpContentList = list<McpContent>
 * @psalm-type McpToolCallResult = array{
 *     content: McpContentList,
 *     isError: bool
 * }
 * @psalm-type McpJsonRpcResponse = array{
 *     jsonrpc: string,
 *     id: int|string|null,
 *     result?: McpInitializeResult|McpToolsListResult|McpToolCallResult,
 *     error?: McpJsonRpcError
 * }
 * @psalm-type McpJsonRpcRequest = array{
 *     jsonrpc: string,
 *     method: string,
 *     id: int|string|null,
 *     params?: array<string, mixed>
 * }
 * @psalm-type McpToolCallParams = array{
 *     name?: string,
 *     arguments?: array<string, mixed>
 * }
 */

/*
 * Server Implementation
 */

// Log startup to STDERR (STDOUT is reserved for JSON-RPC responses)
fwrite(STDERR, "Starting ALPS MCP Server...\n");
fwrite(STDERR, 'Server: ' . SERVER_NAME . ' v' . SERVER_VERSION . "\n");
fwrite(STDERR, 'Protocol: MCP ' . MCP_PROTOCOL_VERSION . "\n\n");

// Handle JSON-RPC requests from STDIN
while ($line = fgets(STDIN)) {
    $request = json_decode(trim($line), true);

    // Validate JSON-RPC request structure
    if (! is_array($request) || ! isset($request['jsonrpc'], $request['method'])) {
        fwrite(STDERR, 'Malformed JSON-RPC request: ' . trim($line) . "\n");

        // Only send error response for requests with id (not notifications)
        if (is_array($request) && array_key_exists('id', $request) && $request['id'] !== null) {
            $errorResponse = [
                'jsonrpc' => '2.0',
                'error' => [
                    'code' => -32600,
                    'message' => 'Invalid Request',
                ],
                'id' => $request['id'],
            ];

            $encodedError = json_encode($errorResponse);
            if ($encodedError !== false) {
                fwrite(STDOUT, $encodedError . "\n");
            }
        }

        continue;
    }

    /** @var McpJsonRpcRequest $request */

    $params = $request['params'] ?? null;
    $toolCallParams = is_array($params) ? $params : [];
    /** @var McpToolCallParams $toolCallParams */

    $response = match ($request['method'] ?? '') {
        'initialize' => [
            'jsonrpc' => '2.0',
            'id' => $request['id'],
            'result' => [
                'protocolVersion' => MCP_PROTOCOL_VERSION,
                'serverInfo' => [
                    'name' => SERVER_NAME,
                    'version' => SERVER_VERSION,
                ],
                'capabilities' => [
                    'tools' => (object) [],
                ],
            ],
        ],
        'notifications/initialized' => null, // Notification - no response needed
        'tools/list' => [
            'jsonrpc' => '2.0',
            'id' => $request['id'],
            'result' => [
                'tools' => getToolDefinitions(),
            ],
        ],
        'tools/call' => [
            'jsonrpc' => '2.0',
            'id' => $request['id'],
            'result' => handleToolCall($toolCallParams),
        ],
        'resources/list' => [
            'jsonrpc' => '2.0',
            'id' => $request['id'],
            'result' => [
                'resources' => [],
            ],
        ],
        'prompts/list' => [
            'jsonrpc' => '2.0',
            'id' => $request['id'],
            'result' => [
                'prompts' => [],
            ],
        ],
        default => (
            // Notifications (id=null) don't get error responses
            ! array_key_exists('id', $request) || $request['id'] === null
                ? null
                : [
                    'jsonrpc' => '2.0',
                    'id' => $request['id'],
                    'error' => [
                        'code' => -32601,
                        'message' => 'Method not found',
                    ],
                ]
        )
    };
    /** @var McpJsonRpcResponse|null $response */

    // Send response (skip for notifications)
    if ($response !== null) {
        $encoded = json_encode($response);
        if ($encoded === false) {
            $jsonError = json_last_error_msg();
            fwrite(STDERR, "json_encode failed: $jsonError\n");
        } else {
            fwrite(STDOUT, $encoded . "\n");
        }
    }
}

/*
 * Tool Definitions
 */

/**
 * Define your tools here
 *
 * @return list<array{name: string, description: string, inputSchema: array<string, mixed>}>
 */
function getToolDefinitions(): array
{
    return [
        [
            'name' => 'validate_alps',
            'description' => 'Validate ALPS profile by attempting SVG generation and provide detailed error feedback.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'alps_content' => [
                        'type' => 'string',
                        'description' => 'ALPS profile XML or JSON content to validate',
                    ],
                ],
                'required' => ['alps_content'],
            ],
        ],
        [
            'name' => 'alps2svg',
            'description' => 'Convert ALPS profile content to SVG state diagram. Supports both direct content and file path input.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'alps_content' => [
                        'type' => 'string',
                        'description' => 'ALPS profile content (XML or JSON format)',
                    ],
                    'alps_path' => [
                        'type' => 'string',
                        'description' => 'Path to ALPS profile file (alternative to alps_content)',
                    ],
                    'format' => [
                        'type' => 'string',
                        'description' => 'Output format',
                        'enum' => ['svg', 'both'],
                        'default' => 'svg',
                    ],
                ],
                'required' => [],
            ],
        ],
        [
            'name' => 'alps_guide',
            'description' => 'Get ALPS best practices and reference guide. Use when creating or reviewing ALPS profiles.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => (object) [],
                'required' => [],
            ],
        ],
    ];
}

/*
 * Tool Handlers
 */

/**
 * Handle tool calls - implement your business logic here
 *
 * @param array{name?: string, arguments?: array<string, mixed>} $params
 *
 * @return array{content: list<array{type: string, text: string}>, isError: bool}
 */
function handleToolCall(array $params): array
{
    $toolName = $params['name'] ?? '';
    $arguments = $params['arguments'] ?? [];

    return match ($toolName) {
        'validate_alps' => handleValidateAlps($arguments),
        'alps2svg' => handleAlps2Svg($arguments),
        'alps_guide' => handleAlpsGuide(),
        default => [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Unknown tool: ' . $toolName,
                ],
            ],
            'isError' => true,
        ],
    };
}

/**
 * Validate ALPS profile by attempting SVG generation
 *
 * @param array<string, mixed> $args
 *
 * @return array{content: list<array{type: string, text: string}>, isError: bool}
 */
function handleValidateAlps(array $args): array
{
    $alpsContent = $args['alps_content'] ?? '';

    if (! is_string($alpsContent) || $alpsContent === '') {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error: alps_content parameter is required and must be a non-empty string',
                ],
            ],
            'isError' => true,
        ];
    }

    try {
        debugLog('VALIDATE: Processing ALPS content (length: ' . strlen($alpsContent) . ')');

        // Generate SVG using existing app-state-diagram library
        // Include autoloader
        $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
        debugLog("VALIDATE: Autoloader path: $autoloadPath");

        if (! file_exists($autoloadPath)) {
            throw new Exception("Autoloader not found at: $autoloadPath");
        }

        require_once $autoloadPath;

        // Create temporary file for ALPS content with appropriate extension
        $trimmed = trim($alpsContent);
        if ($trimmed === '') {
            throw new Exception('ALPS content is empty or whitespace-only');
        }

        $extension = $trimmed[0] === '{' ? '.json' : '.xml';
        $tempAlpsFile = tempnam(sys_get_temp_dir(), 'mcp_validate_') . $extension;
        file_put_contents($tempAlpsFile, $alpsContent);

        debugLog("VALIDATE: ALPS file extension: $extension");

        // Create config and generate SVG directly
        $config = new Config(
            profile: $tempAlpsFile,
            watch: false,
            outputMode: 'svg',
            port: 3000
        );

        $profile = new Profile($tempAlpsFile, new LabelName());
        (new PutDiagram())->drawSvgOnly($config, $profile);

        // Get generated SVG file path and read content
        $svgPath = str_replace(['.xml', '.json'], '.svg', $tempAlpsFile);

        if (! file_exists($svgPath)) {
            // Try title version
            $titleSvgPath = str_replace(['.xml', '.json'], '.title.svg', $tempAlpsFile);
            if (file_exists($titleSvgPath)) {
                $svgPath = $titleSvgPath;
            } else {
                // Clean up temp file
                unlink($tempAlpsFile);

                return [
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "❌ ALPS Validation FAILED\n\n**Error**: SVG file not generated - likely ALPS structure issue\n\n**Issues to check**:\n• Missing descriptors referenced by `rt` or `href` attributes\n• Invalid XML/JSON format\n• Missing required ALPS elements\n• Circular references in descriptors\n\n**ALPS Profile**:\n```xml\n" . $alpsContent . "\n```",
                        ],
                    ],
                    'isError' => true,
                ];
            }
        }

        $svgContent = file_get_contents($svgPath);

        // Clean up temp files
        unlink($tempAlpsFile);
        unlink($svgPath);

        // Check if it's an empty placeholder (8x8 pixels)
        if (strpos($svgContent, 'width="8pt"') !== false && strpos($svgContent, 'height="8pt"') !== false) {
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "⚠️ ALPS Validation WARNING\n\n**Issue**: Generated empty diagram (8x8 pixels)\n\n**Common Causes**:\n• No state transitions defined (missing `rt` attributes)\n• Descriptors not properly linked with `href` attributes\n• Missing semantic descriptors that actions reference\n\n**Recommendation**: Add proper state transitions between descriptors\n\n**ALPS Profile**:\n```xml\n" . $alpsContent . "\n```",
                    ],
                ],
                'isError' => false,
            ];
        }

        // Count descriptors and links for detailed feedback
        $descriptorCount = substr_count($alpsContent, '<descriptor') + substr_count($alpsContent, '"descriptor"');
        $linkCount = substr_count($svgContent, 'class="edge"');

        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => "✅ ALPS Validation SUCCESSFUL\n\n**Results**:\n• SVG generated successfully\n• File size: " . strlen($svgContent) . " bytes\n• Descriptors found: ~$descriptorCount\n• State transitions: $linkCount links\n• Format: " . ($extension === '.json' ? 'JSON' : 'XML') . "\n\n**Status**: Ready for use - ALPS profile is valid and generates proper state diagram!",
                ],
            ],
            'isError' => false,
        ];
    } catch (Throwable $e) {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => "❌ ALPS Validation FAILED\n\n**Error**: " . $e->getMessage() . "\n\n**Common Issues**:\n• Invalid XML/JSON syntax\n• Missing required ALPS schema elements\n• Referenced descriptors not defined\n• Malformed descriptor attributes\n\n**ALPS Profile**:\n```xml\n" . $alpsContent . "\n```\n\n**Tip**: Fix the issues above and run validation again.",
                ],
            ],
            'isError' => true,
        ];
    }
}

/**
 * ALPS to SVG tool implementation - Convert existing ALPS profile to SVG
 *
 * @param array<string, mixed> $args
 *
 * @return array{content: list<array{type: string, text: string}>, isError: bool}
 */
function handleAlps2Svg(array $args): array
{
    $alpsContent = $args['alps_content'] ?? '';
    $alpsPath = $args['alps_path'] ?? '';
    $format = $args['format'] ?? 'svg';

    // Support both content string and file path
    if (! empty($alpsPath) && is_string($alpsPath)) {
        // Read from file
        if (! file_exists($alpsPath)) {
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => 'Error: ALPS file not found at path: ' . $alpsPath,
                    ],
                ],
                'isError' => true,
            ];
        }

        $alpsContent = file_get_contents($alpsPath);
        if ($alpsContent === false) {
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => 'Error: Failed to read ALPS file from path: ' . $alpsPath,
                    ],
                ],
                'isError' => true,
            ];
        }
    } elseif (! is_string($alpsContent) || $alpsContent === '') {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error: Either alps_content or alps_path parameter is required',
                ],
            ],
            'isError' => true,
        ];
    }

    try {
        debugLog('DEBUG: Processing ALPS content directly (length: ' . strlen($alpsContent) . ')');

        // Generate SVG using existing app-state-diagram library
        // Include autoloader
        $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
        require_once $autoloadPath;

        // Create temporary file for ALPS content with appropriate extension
        $trimmed = trim($alpsContent);
        if ($trimmed === '') {
            throw new Exception('ALPS content is empty or whitespace-only');
        }

        $extension = $trimmed[0] === '{' ? '.json' : '.xml';
        $tempAlpsFile = tempnam(sys_get_temp_dir(), 'mcp_alps_') . $extension;
        file_put_contents($tempAlpsFile, $alpsContent);

        debugLog("ALPS file extension: $extension");

        // Create config and generate SVG directly
        $config = new Config(
            profile: $tempAlpsFile,
            watch: false,
            outputMode: 'svg',
            port: 3000
        );

        $profile = new Profile($tempAlpsFile, new LabelName());
        (new PutDiagram())->drawSvgOnly($config, $profile);

        // Get generated SVG file path and read content
        $svgPath = str_replace(['.xml', '.json'], '.svg', $tempAlpsFile);

        if (! file_exists($svgPath)) {
            // Try title version
            $titleSvgPath = str_replace(['.xml', '.json'], '.title.svg', $tempAlpsFile);
            if (file_exists($titleSvgPath)) {
                $svgPath = $titleSvgPath;
            } else {
                throw new Exception("SVG file not generated at expected paths: $svgPath or $titleSvgPath");
            }
        }

        $svgContent = file_get_contents($svgPath);

        // Clean up temp files
        unlink($tempAlpsFile);
        unlink($svgPath);

        if ($format === 'svg') {
            // Check if it's an empty placeholder (8x8 pixels)
            if (strpos($svgContent, 'width="8pt"') !== false && strpos($svgContent, 'height="8pt"') !== false) {
                return [
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "⚠️ Generated empty diagram (8x8) - ALPS profile structure issue\n📄 Check ALPS profile:\n\n```xml\n" . $alpsContent . "\n```\n\nThis usually means missing transitions or incorrect descriptor references.",
                        ],
                    ],
                    'isError' => true,
                ];
            }

            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "✅ SVG generated successfully\n📊 " . strlen($svgContent) . " bytes\n\n```svg\n" . $svgContent . "\n```",
                    ],
                ],
                'isError' => false,
            ];
        }

        // Both ALPS and SVG
        if ($format === 'both') {
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "✅ ALPS conversion complete:\n\n**SVG:**\n```svg\n" . $svgContent . "\n```\n\n**ALPS:**\n```xml\n" . $alpsContent . "\n```",
                    ],
                ],
                'isError' => false,
            ];
        }

        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error: Invalid format specified',
                ],
            ],
            'isError' => true,
        ];
    } catch (Throwable $e) {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error converting ALPS to SVG: ' . $e->getMessage(),
                ],
            ],
            'isError' => true,
        ];
    }
}

/**
 * Get ALPS best practices guide
 *
 * @return array{content: list<array{type: string, text: string}>, isError: bool}
 */
function handleAlpsGuide(): array
{
    $guide = getAlpsGuideContent();

    return [
        'content' => [
            [
                'type' => 'text',
                'text' => $guide,
            ],
        ],
        'isError' => false,
    ];
}

/**
 * Read ALPS guide content from SKILL.md
 */
function getAlpsGuideContent(): string
{
    $skillPath = dirname(__DIR__) . '/.claude/skills/alps/SKILL.md';

    if (! file_exists($skillPath)) {
        return getEmbeddedAlpsGuide();
    }

    $content = file_get_contents($skillPath);
    if ($content === false) {
        return getEmbeddedAlpsGuide();
    }

    // Remove YAML frontmatter
    $content = preg_replace('/^---\n.*?\n---\n/s', '', $content);

    return trim($content);
}

/**
 * Fallback embedded ALPS guide when SKILL.md is not available
 */
function getEmbeddedAlpsGuide(): string
{
    return <<<'GUIDE'
# ALPS Best Practices

## What Makes a Good ALPS

1. **States = What the user sees** (e.g., ProductList, ProductDetail, Cart)
2. **Transitions = What the user does** (e.g., goProductDetail, doAddToCart)
3. **Self-documenting** - title explains purpose, doc describes behavior
4. **No unreachable states** - every state has an entry point
5. **Necessary and sufficient** - no over-abstraction

## Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Safe transition | `go` | `goProductList`, `goHome` |
| Unsafe transition | `do` | `doCreateUser`, `doAddToCart` |
| Idempotent transition | `do` | `doUpdateUser`, `doDeleteItem` |
| State/Page | PascalCase | `HomePage`, `ProductDetail` |
| Semantic field | camelCase | `userId`, `productName` |

## Three Layers

1. **Ontology** - Semantic descriptors (data fields)
2. **Taxonomy** - State descriptors (screens/pages)
3. **Choreography** - Transition descriptors (safe/unsafe/idempotent)

## Output Format (JSON)

```json
{
  "$schema": "https://alps-io.github.io/schemas/alps.json",
  "alps": {
    "title": "Application Title",
    "doc": {"value": "Description"},
    "descriptor": [
      {"id": "fieldName", "title": "Human Title"},
      {"id": "StateName", "title": "State Title", "descriptor": [
        {"href": "#fieldName"},
        {"href": "#goNextState"}
      ]},
      {"id": "goNextState", "type": "safe", "rt": "#TargetState", "title": "Navigate"}
    ]
  }
}
```

## Important Rules

- Safe transitions (go*) MUST include target state name: `rt="#ProductList"` → `goProductList`
- Always validate after generation using validate_alps tool
- Tags are space-separated strings, not arrays
GUIDE;
}

/*
 * Utilities
 */

/**
 * Log debug information to STDERR
 */
function debugLog(string $message): void
{
    fwrite(STDERR, "[DEBUG] $message\n");
}
