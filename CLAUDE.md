# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

app-state-diagram is a PHP-based tool that generates visual state diagrams and documentation from ALPS (Application-Level Profile Semantics) profiles. It reads XML or JSON profile files and creates interactive diagrams showing application state transitions.

## Essential Commands

### Build and Testing
```bash
# Run all tests
composer test

# Run test suite with coverage
composer pcov

# Run code style checks
composer cs

# Fix code style issues
composer cs-fix

# Run static analysis
composer sa

# Run full build pipeline
composer build
```

### Development
```bash
# Generate documentation examples
composer docs

# Generate markdown documentation
composer md

# Watch mode for development (requires Node.js)
bin/asd --watch path/to/profile.json

# Generate diagram from ALPS profile
bin/asd path/to/profile.xml
bin/asd path/to/profile.json
```

### Core CLI Tool
The main entry point is `bin/asd` which supports:
- `--watch` or `-w`: Watch mode with live reload (port 3000 by default)
- `--mode=markdown` or `-m`: Generate markdown output
- `--config` or `-c`: Use custom config file
- `--echo` or `-e`: Output to stdout instead of file

## Architecture

### Core Components

**Entry Point**: `bin/asd` - CLI script that orchestrates the diagram generation process

**Main Classes**:
- `Diagram` (src/Diagram.php) - Main orchestrator that coordinates profile parsing and diagram generation
- `Config` (src/Config.php) - Configuration management for CLI options and file paths
- `Profile` (src/Profile.php) - Parses ALPS profiles from XML/JSON
- `DrawDiagram` (src/DrawDiagram.php) - Generates DOT format diagrams from profile data
- `IndexPage` (src/IndexPage.php) - Creates HTML index pages with embedded diagrams

**Data Processing**:
- `AbstractDescriptor` and `SemanticDescriptor` - Represent ALPS descriptors
- `Links` and `Link` - Model application state transitions
- `LabelName*` classes - Handle different labeling strategies for diagram nodes

**Output Generation**:
- `DumpDocs` - Handles different output modes (HTML/Markdown)
- DOT format generation for Graphviz processing
- JavaScript integration via `asd-sync/` for watch mode

### File Structure
- `src/` - Main PHP source code
- `src-xml/` - XML-specific loading functionality  
- `tests/` - PHPUnit test suite with extensive fake data
- `bin/asd` - Main CLI executable
- `asd-sync/` - Node.js components for watch mode and DOT processing
- `docs/` - Example ALPS profiles and generated documentation

### Dependencies
- PHP 8.1+ with standard extensions (json, simplexml, dom, mbstring)
- Composer for PHP dependency management
- Node.js for watch mode and DOT file processing
- Graphviz (via Node.js) for SVG generation

## Development Notes

### Testing
Tests use extensive fake ALPS profiles in `tests/Fake/` directory. The test suite covers XML/JSON parsing, diagram generation, and various edge cases.

### Code Quality
Project uses strict PHP typing, PSR standards, and comprehensive static analysis via PHPStan and Psalm.

### Watch Mode
The `--watch` option starts a Node.js server that monitors profile changes and regenerates diagrams automatically. This requires the `asd-sync/` directory with npm dependencies.

**Homebrew Installation Notes:**
- Watch mode path resolution handles both Cellar and opt directory structures
- Uses dynamic Homebrew prefix detection via `brew --prefix`
- Supports both ARM (`/opt/homebrew`) and Intel (`/usr/local`) architectures

**Troubleshooting Watch Mode:**
- Error messages show expected path for debugging
- Ensure Node.js dependencies are installed in the asd-sync directory