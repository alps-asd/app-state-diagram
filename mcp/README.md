# MCP PHP Skeleton

A minimal, type-safe Model Context Protocol (MCP) server implementation for PHP.

## Features

✅ **Full MCP Protocol Compliance**
- JSON-RPC 2.0 specification
- MCP Protocol 2024-11-05 support
- Complete type definitions with Psalm

✅ **Production Ready**
- Comprehensive error handling  
- Input validation and sanitization
- Proper STDIN/STDOUT communication
- Type-safe implementation

✅ **Developer Friendly**
- Well-documented code structure
- Example tools with proper schemas
- Easy customization points
- Debug logging support

## Quick Start

### 1. Basic Usage

```bash
# Make executable
chmod +x mcp-skelton-server.php

# Run the server
php mcp-skelton-server.php
```

The server will start and listen for JSON-RPC requests on STDIN.

### 2. Available Tools

The MCP server provides these tools:

- **`validate_alps`** - Validate ALPS profiles and get detailed error feedback
- **`alps2svg`** - Convert ALPS profiles to SVG diagrams
- **`echo`** - Echo back a message (great for testing connectivity)
- **`test_svg`** - Display a test SVG diagram

### 3. MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "asd-mcp": {
      "command": "php",
      "args": ["/path/to/asd-mcp.php"]
    }
  }
}
```

## Customization Guide

### 1. Update Server Information

```php
// Configuration - Customize these values
const SERVER_NAME = 'your-server-name';
const SERVER_VERSION = '1.0.0';
```

### 2. Define Your Tools

Edit the `getToolDefinitions()` function:

```php
function getToolDefinitions(): array
{
    return [
        [
            'name' => 'myTool',
            'description' => 'Description of what your tool does',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'param1' => [
                        'type' => 'string',
                        'description' => 'Parameter description',
                    ],
                ],
                'required' => ['param1'],
            ],
        ],
        // Add more tools...
    ];
}
```

### 3. Implement Tool Logic

Add your tool implementation to `handleToolCall()`:

```php
return match ($toolName) {
    'myTool' => handleMyTool($arguments),
    // Add more tools...
    default => [
        'content' => [['type' => 'text', 'text' => 'Unknown tool: ' . $toolName]],
        'isError' => true,
    ],
};
```

### 4. Add Tool Functions

Create your tool handler functions:

```php
function handleMyTool(array $args): array
{
    // Validate inputs
    $param1 = $args['param1'] ?? '';
    if (!is_string($param1) || $param1 === '') {
        return [
            'content' => [['type' => 'text', 'text' => 'Error: param1 is required']],
            'isError' => true,
        ];
    }

    // Your business logic here
    $result = doSomethingWith($param1);

    return [
        'content' => [['type' => 'text', 'text' => "Result: $result"]],
        'isError' => false,
    ];
}
```

## Type Safety

This skeleton uses comprehensive Psalm type definitions for full type safety:

- `McpJsonRpcRequest` - Incoming requests
- `McpJsonRpcResponse` - Outgoing responses  
- `McpToolCallResult` - Tool execution results
- `McpTool` - Tool definitions

## Error Handling

The skeleton handles common error scenarios:

- Malformed JSON-RPC requests
- Unknown methods
- Tool execution errors
- Input validation failures

Errors are logged to STDERR while keeping STDOUT clean for JSON-RPC responses.

## Development Tips

### Debugging

Enable debug logging in your tool functions:

```php
function handleMyTool(array $args): array
{
    debugLog("MyTool called with: " . json_encode($args));
    // ... your logic
}
```

### Testing

Test your server with curl or other JSON-RPC clients:

```bash
# Test initialize
echo '{"jsonrpc":"2.0","method":"initialize","id":1}' | php mcp-skelton-server.php

# Test tools/list  
echo '{"jsonrpc":"2.0","method":"tools/list","id":2}' | php mcp-skelton-server.php

# Test tool call
echo '{"jsonrpc":"2.0","method":"tools/call","id":3,"params":{"name":"echo","arguments":{"message":"Hello"}}}' | php mcp-skelton-server.php
```

### Input Validation

Always validate and sanitize user inputs:

```php
if (!validateInput($userInput, 'string')) {
    return ['content' => [['type' => 'text', 'text' => 'Invalid input']], 'isError' => true];
}
```

## Architecture

```text
┌─────────────────┐    JSON-RPC     ┌──────────────────┐
│   MCP Client    │◄──────────────►│  mcp-skelton-    │
│  (Claude, etc)  │   STDIN/STDOUT   │     server.php   │
└─────────────────┘                 └──────────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  Your Business   │
                                    │      Logic       │
                                    └──────────────────┘
```

## License

This skeleton is provided as a starting point for MCP server development.
Feel free to modify and use in your own projects.

## Support

For MCP protocol questions, see the official MCP documentation.
For PHP-specific implementation questions, check the code comments and type definitions.
