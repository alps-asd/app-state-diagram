#!/bin/bash

# MCP PHP Skeleton Test Script
# This script tests the basic functionality of the MCP server

echo "Testing MCP PHP Skeleton Server..."
echo "=================================="

# Make server executable
chmod +x mcp-skelton-server.php

# Test 1: Initialize
echo "Test 1: Initialize"
echo '{"jsonrpc":"2.0","method":"initialize","id":1}' | php mcp-skelton-server.php
echo ""

# Test 2: Tools list
echo "Test 2: Tools List"
echo '{"jsonrpc":"2.0","method":"tools/list","id":2}' | php mcp-skelton-server.php
echo ""

# Test 3: Echo tool
echo "Test 3: Echo Tool"
echo '{"jsonrpc":"2.0","method":"tools/call","id":3,"params":{"name":"echo","arguments":{"message":"Hello MCP!"}}}' | php mcp-skelton-server.php
echo ""

# Test 4: Get current time
echo "Test 4: Get Current Time"
echo '{"jsonrpc":"2.0","method":"tools/call","id":4,"params":{"name":"getCurrentTime","arguments":{"format":"readable","timezone":"UTC"}}}' | php mcp-skelton-server.php
echo ""

# Test 5: Get system info
echo "Test 5: Get System Info"
echo '{"jsonrpc":"2.0","method":"tools/call","id":5,"params":{"name":"getSystemInfo","arguments":{}}}' | php mcp-skelton-server.php
echo ""

# Test 6: Unknown method (should return error)
echo "Test 6: Unknown Method (Error Test)"
echo '{"jsonrpc":"2.0","method":"unknown/method","id":6}' | php mcp-skelton-server.php
echo ""

# Test 7: Unknown tool (should return error)
echo "Test 7: Unknown Tool (Error Test)"
echo '{"jsonrpc":"2.0","method":"tools/call","id":7,"params":{"name":"unknownTool","arguments":{}}}' | php mcp-skelton-server.php
echo ""

echo "Testing complete!"