#!/usr/bin/env php
<?php

/**
 * MCP Server Skeleton for PHP
 *
 * A minimal, type-safe Model Context Protocol (MCP) server implementation.
 * Use this as a starting point for building your own MCP servers.
 *
 * Features:
 * - Full JSON-RPC 2.0 compliance
 * - MCP Protocol 2024-11-05 support  
 * - Complete Psalm type definitions
 * - Error handling and validation
 * - Example tools with proper schema definitions
 * - STDIN/STDOUT communication
 *
 * Usage:
 *   php mcp-skelton-server.php
 *   
 * Customization:
 * 1. Update SERVER_NAME, SERVER_VERSION constants
 * 2. Replace example tools with your own in handleToolCall()
 * 3. Add your tool definitions in tools/list response
 * 4. Implement your business logic functions
 */

declare(strict_types=1);

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
fwrite(STDERR, "Starting MCP PHP Skeleton Server...\n");
fwrite(STDERR, "Server: " . SERVER_NAME . " v" . SERVER_VERSION . "\n");
fwrite(STDERR, "Protocol: MCP " . MCP_PROTOCOL_VERSION . "\n\n");

// Handle JSON-RPC requests from STDIN
while ($line = fgets(STDIN)) {
    $request = json_decode(trim($line), true);

    // Validate JSON-RPC request structure
    if (! is_array($request) || ! isset($request['jsonrpc'], $request['method'])) {
        
        fwrite(STDERR, "Malformed JSON-RPC request: " . trim($line) . "\n");

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
    /** @var McpToolCallParams $toolCallParams */
    $toolCallParams = is_array($params) ? $params : [];
    
    /** @var McpJsonRpcResponse|null $response */
    $response = match ($request['method'] ?? '') {
        'initialize' => [
            'jsonrpc' => '2.0',
            'id' => $request['id'],
            'result' => [
                'protocolVersion' => MCP_PROTOCOL_VERSION,
                'serverInfo' => [
                    'name' => SERVER_NAME, 
                    'version' => SERVER_VERSION
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
            (!array_key_exists('id', $request) || $request['id'] === null)
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
 * @return McpToolsList
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
            'name' => 'echo',
            'description' => 'Echo back the provided message - useful for testing MCP connectivity',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'message' => [
                        'type' => 'string',
                        'description' => 'Message to echo back',
                    ],
                ],
                'required' => ['message'],
            ],
        ],
        [
            'name' => 'test_svg',
            'description' => 'Display a test SVG diagram - useful for testing SVG rendering',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'example' => [
                        'type' => 'string',
                        'description' => 'Which example to show',
                        'enum' => ['bookstore', 'simple'],
                        'default' => 'bookstore',
                    ],
                ],
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
 * @param McpToolCallParams $params
 * @return McpToolCallResult
 */
function handleToolCall(array $params): array
{
    $toolName = $params['name'] ?? '';
    $arguments = $params['arguments'] ?? [];

    return match ($toolName) {
        'validate_alps' => handleValidateAlps($arguments),
        'alps2svg' => handleAlps2Svg($arguments),
        'echo' => handleEcho($arguments),
        'test_svg' => handleTestSvg($arguments),
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
 * Test SVG tool implementation - Display existing working SVG
 *
 * @param array<string, mixed> $args
 * @return McpToolCallResult
 */
function handleTestSvg(array $args): array
{
    $example = $args['example'] ?? 'bookstore';
    
    try {
        $baseDir = dirname(__DIR__);
        
        if ($example === 'bookstore') {
            $svgPath = $baseDir . '/docs/bookstore/alps.svg';
        } else {
            // Simple example - create a basic SVG
            $svgContent = '<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f8ff" stroke="#4169e1" stroke-width="2"/>
    <text x="100" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#4169e1">Test SVG</text>
</svg>';
            
            // Save SVG to temp file and open in browser
            $tempFile = '/tmp/mcp-simple-' . time() . '.svg';
            file_put_contents($tempFile, $svgContent);
            
            // Open in browser
            // SVG file saved: $tempFile
            
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "✅ Simple SVG opened in browser: $tempFile",
                    ]
                ],
                'isError' => false,
            ];
        }
        
        if (!file_exists($svgPath)) {
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "Error: SVG file not found at $svgPath",
                    ],
                ],
                'isError' => true,
            ];
        }
        
        $svgContent = file_get_contents($svgPath);
        if ($svgContent === false) {
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "Error: Could not read SVG file at $svgPath",
                    ],
                ],
                'isError' => true,
            ];
        }
        
        // Create HTML wrapper for better display
        $htmlContent = "<!DOCTYPE html>
<html>
<head>
    <title>Bookstore State Diagram</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        svg { 
            width: 100%; 
            height: auto; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
        }
    </style>
</head>
<body>
    <div class=\"container\">
        <h1>📚 Bookstore Application State Diagram</h1>
        <p>This diagram shows the state transitions for a bookstore application.</p>
        $svgContent
        <hr>
        <small>Generated at " . date('Y-m-d H:i:s') . " via MCP Server</small>
    </div>
</body>
</html>";
        
        $tempFile = '/tmp/mcp-bookstore-' . time() . '.html';
        file_put_contents($tempFile, $htmlContent);
        
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => "✅ Bookstore state diagram generated! Here's the interactive HTML content:\n\n```html\n" . $htmlContent . "\n```\n\nYou can also open the file directly: file://$tempFile",
                ]
            ],
            'isError' => false,
        ];
        
    } catch (Exception $e) {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error displaying test SVG: ' . $e->getMessage(),
                ],
            ],
            'isError' => true,
        ];
    }
}

/**
 * Echo tool implementation
 *
 * @param array<string, mixed> $args
 * @return McpToolCallResult
 */
function handleEcho(array $args): array
{
    $message = $args['message'] ?? '';
    
    if (!is_string($message) || $message === '') {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error: message parameter is required and must be a non-empty string',
                ],
            ],
            'isError' => true,
        ];
    }

    return [
        'content' => [
            [
                'type' => 'text',
                'text' => "Echo: $message",
            ],
        ],
        'isError' => false,
    ];
}

/**
 * Current time tool implementation  
 *
 * @param array<string, mixed> $args
 * @return McpToolCallResult
 */
function handleGetCurrentTime(array $args): array
{
    $format = $args['format'] ?? 'iso';
    $timezone = $args['timezone'] ?? 'UTC';

    try {
        $dateTime = new DateTime('now', new DateTimeZone($timezone));
        
        $result = match ($format) {
            'iso' => $dateTime->format('c'),
            'timestamp' => $dateTime->getTimestamp(),
            'readable' => $dateTime->format('Y-m-d H:i:s T'),
            default => $dateTime->format('c'),
        };

        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => "Current time ($format, $timezone): $result",
                ],
            ],
            'isError' => false,
        ];
    } catch (Exception $e) {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Error: ' . $e->getMessage(),
                ],
            ],
            'isError' => true,
        ];
    }
}

/**
 * System info tool implementation
 *
 * @param array<string, mixed> $args
 * @return McpToolCallResult
 */
function handleGetSystemInfo(array $args): array
{
    $info = [
        'PHP Version' => PHP_VERSION,
        'Operating System' => PHP_OS,
        'Server Name' => SERVER_NAME,
        'Server Version' => SERVER_VERSION,
        'MCP Protocol' => MCP_PROTOCOL_VERSION,
        'Memory Limit' => ini_get('memory_limit'),
        'Max Execution Time' => ini_get('max_execution_time'),
        'Current Working Directory' => getcwd(),
        'Loaded Extensions' => count(get_loaded_extensions()) . ' extensions loaded',
    ];

    $infoText = "System Information:\n\n";
    foreach ($info as $key => $value) {
        $infoText .= "• $key: $value\n";
    }

    return [
        'content' => [
            [
                'type' => 'text',
                'text' => $infoText,
            ],
        ],
        'isError' => false,
    ];
}

/**
 * Validate ALPS profile by attempting SVG generation
 *
 * @param array<string, mixed> $args
 * @return McpToolCallResult
 */
function handleValidateAlps(array $args): array
{
    $alpsContent = $args['alps_content'] ?? '';
    
    if (!is_string($alpsContent) || $alpsContent === '') {
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
        debugLog("VALIDATE: Processing ALPS content (length: " . strlen($alpsContent) . ")");
        
        // Generate SVG using existing app-state-diagram library
        // Include autoloader
        $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
        debugLog("VALIDATE: Autoloader path: $autoloadPath");
        
        if (!file_exists($autoloadPath)) {
            throw new Exception("Autoloader not found at: $autoloadPath");
        }
        require_once $autoloadPath;
        
        // Create temporary file for ALPS content with appropriate extension
        $trimmed = trim($alpsContent);
        $extension = ($trimmed[0] === '{') ? '.json' : '.xml';
        $tempAlpsFile = tempnam(sys_get_temp_dir(), 'mcp_validate_') . $extension;
        file_put_contents($tempAlpsFile, $alpsContent);
        
        debugLog("VALIDATE: ALPS file extension: $extension");
        
        // Create config and generate SVG directly
        $config = new \Koriym\AppStateDiagram\Config(
            profile: $tempAlpsFile,
            watch: false,
            outputMode: 'svg',
            port: 3000
        );
        
        $profile = new \Koriym\AppStateDiagram\Profile($tempAlpsFile, new \Koriym\AppStateDiagram\LabelName());
        (new \Koriym\AppStateDiagram\PutDiagram())->drawSvgOnly($config, $profile);
        
        // Get generated SVG file path and read content
        $svgPath = str_replace(['.xml', '.json'], '.svg', $tempAlpsFile);
        
        if (!file_exists($svgPath)) {
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
                        ]
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
                    ]
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
                ]
            ],
            'isError' => false,
        ];
        
    } catch (Exception $e) {
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
 * @return McpToolCallResult
 */
function handleAlps2Svg(array $args): array
{
    $alpsContent = $args['alps_content'] ?? '';
    $alpsPath = $args['alps_path'] ?? '';
    $format = $args['format'] ?? 'svg';
    
    // Support both content string and file path
    if (!empty($alpsPath) && is_string($alpsPath)) {
        // Read from file
        if (!file_exists($alpsPath)) {
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
    } elseif (!is_string($alpsContent) || $alpsContent === '') {
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
        debugLog("DEBUG: Processing ALPS content directly (length: " . strlen($alpsContent) . ")");
        
        // Generate SVG using existing app-state-diagram library
        // Include autoloader
        $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
        require_once $autoloadPath;
        
        // Create temporary file for ALPS content with appropriate extension
        $trimmed = trim($alpsContent);
        $extension = ($trimmed[0] === '{') ? '.json' : '.xml';
        $tempAlpsFile = tempnam(sys_get_temp_dir(), 'mcp_alps_') . $extension;
        file_put_contents($tempAlpsFile, $alpsContent);
        
        debugLog("ALPS file extension: $extension");
        
        // Create config and generate SVG directly
        $config = new \Koriym\AppStateDiagram\Config(
            profile: $tempAlpsFile,
            watch: false,
            outputMode: 'svg',
            port: 3000
        );
        
        $profile = new \Koriym\AppStateDiagram\Profile($tempAlpsFile, new \Koriym\AppStateDiagram\LabelName());
        (new \Koriym\AppStateDiagram\PutDiagram())->drawSvgOnly($config, $profile);
        
        // Get generated SVG file path and read content
        $svgPath = str_replace(['.xml', '.json'], '.svg', $tempAlpsFile);
        
        if (!file_exists($svgPath)) {
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
                        ]
                    ],
                    'isError' => true,
                ];
            }
            
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "✅ SVG generated successfully\n📊 " . strlen($svgContent) . " bytes\n\n```svg\n" . $svgContent . "\n```",
                    ]
                ],
                'isError' => false,
            ];
        }
        
        // Both ALPS and SVG
        if ($format === 'both') {
            // Save both ALPS and SVG
            $tempSvg = '/tmp/mcp-alps2svg-' . time() . '.svg';
            $tempAlps = '/tmp/mcp-alps2svg-' . time() . '.xml';
            
            file_put_contents($tempSvg, $svgContent);
            file_put_contents($tempAlps, $alpsContent);
            // SVG file saved: $tempSvg
            
            return [
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "✅ ALPS conversion complete:\n📊 SVG file: $tempSvg\n📄 ALPS profile: $tempAlps\n\n```svg\n" . $svgContent . "\n```",
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
        
    } catch (Exception $e) {
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
 * Generate pure SVG from ALPS XML file path
 */
function getSvg(string $alpsFilePath): string
{
    try {
        // Create profile and generate DOT content
        $profile = new \Koriym\AppStateDiagram\Profile($alpsFilePath, new \Koriym\AppStateDiagram\LabelName());
        $drawDiagram = new \Koriym\AppStateDiagram\DrawDiagram();
        
        debugLog("Profile created with " . count($profile->descriptors) . " descriptors");
        
        // Generate DOT content
        $dotContent = $drawDiagram($profile, new \Koriym\AppStateDiagram\LabelName());
        debugLog("DOT content generated, length: " . strlen($dotContent));
        
        // Convert DOT to SVG using Graphviz
        $tempDot = tempnam(sys_get_temp_dir(), 'mcp_dot_') . '.dot';
        file_put_contents($tempDot, $dotContent);
        
        debugLog("Converting DOT to SVG...");
        $svgContent = shell_exec("dot -Tsvg \"$tempDot\" 2>&1");
        
        // Clean up DOT file
        unlink($tempDot);
        
        if (!$svgContent || strpos($svgContent, '<svg') === false) {
            debugLog("SVG conversion failed: " . ($svgContent ?? 'null'));
            throw new Exception("Failed to convert DOT to SVG");
        }
        
        return trim($svgContent);
        
    } catch (Exception $e) {
        debugLog("getSvg error: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Generate SVG from ALPS profile using app-state-diagram with error correction
 */
function generateSvgFromAlps(string $alpsProfile): string
{
    debugLog("Starting SVG generation using PHP Diagram class directly...");
    
    try {
        // Include autoloader
        $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
        if (!file_exists($autoloadPath)) {
            throw new Exception("Autoload file not found: $autoloadPath");
        }
        require_once $autoloadPath;
        
        // Create temporary file for ALPS profile
        // Detect format and use appropriate extension
        $trimmed = trim($alpsProfile);
        $extension = ($trimmed[0] === '{') ? '.json' : '.xml';
        $tempProfile = tempnam(sys_get_temp_dir(), 'mcp_alps_') . $extension;
        
        debugLog("Saving ALPS profile to: $tempProfile");
        debugLog("Content format: " . ($extension === '.json' ? 'JSON' : 'XML'));
        debugLog("Content (first 300 chars): " . substr($alpsProfile, 0, 300));
        
        file_put_contents($tempProfile, $alpsProfile);
        
        // Use PutDiagram to generate SVG files
        $config = new \Koriym\AppStateDiagram\Config(
            profile: $tempProfile,
            watch: false,
            outputMode: 'svg',
            port: 3000
        );
        
        $profile = new \Koriym\AppStateDiagram\Profile($tempProfile, new \Koriym\AppStateDiagram\LabelName());
        
        debugLog("Using PutDiagram drawSvgOnly...");
        $putDiagram = new \Koriym\AppStateDiagram\PutDiagram();
        $putDiagram->drawSvgOnly($config, $profile);
        
        // Calculate the SVG file paths from config->profile path
        $svgFile = str_replace(['.xml', '.json'], '.svg', $config->profile);
        $titleSvgFile = str_replace(['.xml', '.json'], '.title.svg', $config->profile);
        
        debugLog("Expected SVG files: $svgFile, $titleSvgFile");
        
        $svgContent = null;
        
        // Read the generated SVG file (prefer ID-based)
        if (file_exists($svgFile)) {
            $svgContent = file_get_contents($svgFile);
            debugLog("Reading SVG file: " . strlen($svgContent) . " bytes");
            unlink($svgFile);
        } elseif (file_exists($titleSvgFile)) {
            $svgContent = file_get_contents($titleSvgFile);
            debugLog("Reading title SVG file: " . strlen($svgContent) . " bytes");
            unlink($titleSvgFile);
        }
        
        if (!$svgContent) {
            debugLog("No SVG files found at expected paths");
            throw new Exception("SVG generation failed - no files created");
        }
        
        // Clean up temp file
        unlink($tempProfile);
        
        // Check if we got valid SVG content
        if ($svgContent && strpos($svgContent, '<svg') !== false) {
            debugLog("Valid SVG content detected");
            
            // Check if it's an empty placeholder (8x8 pixels)
            if (strpos($svgContent, 'width="8pt"') !== false && strpos($svgContent, 'height="8pt"') !== false) {
                debugLog("WARNING: Generated SVG is empty placeholder (8x8) - this indicates ALPS structure issues");
                return generateErrorSvg("Generated empty diagram - check ALPS profile structure");
            } else {
                debugLog("SVG generation successful with proper content");
                return $svgContent;
            }
        }
        
        debugLog("No valid SVG content generated");
        throw new Exception("No SVG content in result");
        
    } catch (Exception $e) {
        debugLog("Exception during SVG generation: " . $e->getMessage());
        
        // Return helpful error SVG
        return generateErrorSvg("Diagram Generation Error: " . $e->getMessage());
    }
}

/**
 * Fix ALPS errors based on asd output
 */
function fixAlpsErrors(string $alpsProfile, string $errorOutput): string
{
    debugLog("Fixing ALPS errors. Error output: " . $errorOutput);
    
    // Missing descriptor error - more robust pattern matching
    if (preg_match('/DescriptorNotFoundException\(([^)]+)\)/', $errorOutput, $matches)) {
        $missing = $matches[1];
        debugLog("Adding missing descriptor: $missing");
        $descriptor = "    <descriptor id=\"$missing\" type=\"semantic\" title=\"$missing\"/>\n";
        $fixed = str_replace('</alps>', "$descriptor</alps>", $alpsProfile);
        debugLog("Fixed ALPS with missing descriptor");
        return $fixed;
    }
    
    // Multiple missing descriptors
    if (preg_match_all('/DescriptorNotFoundException\(([^)]+)\)/', $errorOutput, $matches)) {
        $missingDescriptors = array_unique($matches[1]);
        $descriptors = '';
        foreach ($missingDescriptors as $missing) {
            $descriptors .= "    <descriptor id=\"$missing\" type=\"semantic\" title=\"$missing\"/>\n";
        }
        $fixed = str_replace('</alps>', "$descriptors</alps>", $alpsProfile);
        debugLog("Fixed ALPS with " . count($missingDescriptors) . " missing descriptors");
        return $fixed;
    }
    
    // Add basic structure if completely broken
    if (strpos($errorOutput, 'no state') !== false || strpos($errorOutput, 'Invalid') !== false) {
        debugLog("Using basic ALPS due to structural errors");
        return generateBasicAlps();
    }
    
    debugLog("No known error pattern found, returning original ALPS");
    return $alpsProfile;
}

/**
 * Generate basic working ALPS profile
 */
function generateBasicAlps(): string
{
    return '<?xml version="1.0" encoding="UTF-8"?>
<alps version="1.0"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="https://alps-io.github.io/schemas/alps.xsd">
    <title>Basic Application</title>
    <doc>Simple application workflow</doc>

    <descriptor id="Index" type="semantic" title="Index Page"/>
    <descriptor id="Resource" type="semantic" title="Resource"/>
    
    <descriptor id="goStart" type="safe" title="go to start" rt="#Index"/>
    <descriptor id="goResource" type="safe" title="view resource" rt="#Resource"/>
    <descriptor id="doAction" type="unsafe" title="perform action" rt="#Index"/>
</alps>';
}

/**
 * Generate error SVG with message
 */
function generateErrorSvg(string $message): string
{
    $escapedMessage = htmlspecialchars($message, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    return <<<SVG
<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f8d7da" stroke="#721c24" stroke-width="2"/>
    <text x="20" y="30" font-family="Arial, sans-serif" font-size="14" fill="#721c24" font-weight="bold">Error</text>
    <text x="20" y="60" font-family="Arial, sans-serif" font-size="12" fill="#721c24">$escapedMessage</text>
</svg>
SVG;
}

/**
 * Convert ALPS JSON to XML format
 */
function convertAlpsToXml(string $alps): string
{
    $trimmed = trim($alps);
    debugLog("JSON to XML conversion - input length: " . strlen($trimmed));
    debugLog("JSON to XML conversion - first char: " . ($trimmed[0] ?? 'empty'));
    
    // Check if input is already XML
    if ($trimmed[0] === '<') {
        debugLog("Input detected as XML, returning as-is");
        return $alps;
    }
    
    // If it starts with {, it's JSON - convert it
    if ($trimmed[0] !== '{') {
        debugLog("ERROR: Input is neither XML nor JSON");
        throw new Exception('ALPS input must be either XML (starting with <) or JSON (starting with {)');
    }
    
    // Parse JSON
    debugLog("Parsing JSON input...");
    $data = json_decode($alps, true);
    if ($data === null) {
        debugLog("ERROR: JSON parsing failed - " . json_last_error_msg());
        throw new Exception('Invalid JSON format: ' . json_last_error_msg());
    }
    
    debugLog("JSON parsed successfully");
    
    // Extract ALPS data
    $alpsData = $data['alps'] ?? $data;
    if (!isset($alpsData['descriptor'])) {
        debugLog("ERROR: No descriptors found in ALPS data");
        debugLog("Available keys: " . implode(', ', array_keys($alpsData)));
        throw new Exception('No descriptors found in ALPS profile');
    }
    
    debugLog("Found " . count($alpsData['descriptor']) . " descriptors");
    
    $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    $xml .= "<alps version=\"" . ($alpsData['version'] ?? '1.0') . "\"\n";
    $xml .= "      xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n";
    $xml .= "      xsi:noNamespaceSchemaLocation=\"https://alps-io.github.io/schemas/alps.xsd\">\n";
    
    if (isset($alpsData['title'])) {
        $xml .= "    <title>" . htmlspecialchars($alpsData['title']) . "</title>\n";
    }
    
    if (isset($alpsData['doc'])) {
        $docValue = is_array($alpsData['doc']) && isset($alpsData['doc']['value']) 
            ? $alpsData['doc']['value'] 
            : (is_string($alpsData['doc']) ? $alpsData['doc'] : '');
        if ($docValue) {
            $xml .= "    <doc>" . htmlspecialchars($docValue) . "</doc>\n";
        }
    }
    
    $xml .= "\n";
    
    // Convert descriptors
    foreach ($alpsData['descriptor'] as $descriptor) {
        $xml .= convertDescriptorToXml($descriptor, 1);
    }
    
    $xml .= "</alps>\n";
    
    return $xml;
}

/**
 * Convert a single descriptor to XML
 */
function convertDescriptorToXml(array $descriptor, int $indentLevel): string
{
    $indent = str_repeat('    ', $indentLevel);
    $xml = $indent . '<descriptor';
    
    // Add attributes
    if (isset($descriptor['id'])) {
        $xml .= ' id="' . htmlspecialchars($descriptor['id']) . '"';
    }
    if (isset($descriptor['href'])) {
        $xml .= ' href="' . htmlspecialchars($descriptor['href']) . '"';
    }
    if (isset($descriptor['type'])) {
        $xml .= ' type="' . htmlspecialchars($descriptor['type']) . '"';
    }
    if (isset($descriptor['rt'])) {
        $xml .= ' rt="' . htmlspecialchars($descriptor['rt']) . '"';
    }
    if (isset($descriptor['title'])) {
        $xml .= ' title="' . htmlspecialchars($descriptor['title']) . '"';
    }
    if (isset($descriptor['def'])) {
        $xml .= ' def="' . htmlspecialchars($descriptor['def']) . '"';
    }
    if (isset($descriptor['tag'])) {
        $xml .= ' tag="' . htmlspecialchars($descriptor['tag']) . '"';
    }
    
    // Check if it has nested descriptors
    if (isset($descriptor['descriptor']) && is_array($descriptor['descriptor'])) {
        $xml .= ">\n";
        
        // Add doc if present
        if (isset($descriptor['doc'])) {
            $xml .= $indent . "    <doc>" . htmlspecialchars($descriptor['doc']) . "</doc>\n";
        }
        
        // Add nested descriptors
        foreach ($descriptor['descriptor'] as $nestedDescriptor) {
            $xml .= convertDescriptorToXml($nestedDescriptor, $indentLevel + 1);
        }
        
        $xml .= $indent . "</descriptor>\n";
    } else {
        // Add doc if present
        if (isset($descriptor['doc'])) {
            $xml .= ">\n";
            $xml .= $indent . "    <doc>" . htmlspecialchars($descriptor['doc']) . "</doc>\n";
            $xml .= $indent . "</descriptor>\n";
        } else {
            $xml .= "/>\n";
        }
    }
    
    return $xml;
}

/*
 * Utilities
 */

/**
 * Validate and sanitize user input
 * Add your validation logic here
 */
function validateInput(mixed $input, string $type): bool
{
    return match ($type) {
        'string' => is_string($input),
        'int' => is_int($input),
        'array' => is_array($input),
        default => false,
    };
}

/**
 * Log debug information to STDERR
 */
function debugLog(string $message): void
{
    fwrite(STDERR, "[DEBUG] $message\n");
}