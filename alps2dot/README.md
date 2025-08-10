# alps2dot

Convert ALPS (Application-Level Profile Semantics) documents to DOT format for Graphviz visualization.

This is the TypeScript version of the ALPS to DOT converter, providing PHP-compatible high-quality DOT output generation for the app-state-diagram project.

## Installation

```bash
npm install alps2dot
```

Or install globally:

```bash
npm install -g alps2dot
```

## CLI Usage

### Basic Usage

```bash
# Convert ALPS JSON to DOT
alps2dot profile.json

# Convert ALPS XML to DOT  
alps2dot profile.xml

# Output to file
alps2dot profile.json -o output.dot

# Use title-based labels instead of IDs
alps2dot profile.json -l title

# Generate both ID and title versions
alps2dot profile.json -l both -o diagram
# Creates: diagram.dot (ID labels) and diagram.title.dot (title labels)
```

### Command Line Options

```
Usage: alps2dot [options] [command] <input>

Arguments:
  input                       input ALPS file (JSON or XML)

Options:
  -V, --version               output the version number
  -o, --output <file>         output file (default: stdout)
  -f, --format <format>       input format (json|xml, auto-detect if not specified)
  -l, --label <strategy>      label strategy: id (default), title, both
  --validate-only             validate input without generating output
  --verbose                   verbose error messages
  -h, --help                  display help for command

Commands:
  validate <input>            validate ALPS document without generating output
```

### Examples

```bash
# Basic conversion
alps2dot bookstore.json > bookstore.dot

# Validate ALPS document
alps2dot validate bookstore.json

# Generate with titles for better readability
alps2dot bookstore.json -l title -o bookstore-titles.dot

# Create both versions for comparison
alps2dot bookstore.json -l both -o bookstore
```

## Programmatic Usage

```typescript
import { Alps2Dot } from 'alps2dot';

const alps2dot = new Alps2Dot();

// Convert with ID labels (default)
const dotOutput = alps2dot.convert(alpsContent);

// Convert with title labels
const dotWithTitles = alps2dot.convertWithLabel(alpsContent, 'title');

// Generate both versions
const { id, title } = alps2dot.convertBoth(alpsContent);

// Validate only
const document = alps2dot.parseOnly(alpsContent);
const validation = alps2dot.validateOnly(document);
if (!validation.isValid) {
  console.error('Invalid ALPS:', validation.errors);
}
```

## Composer Integration (app-state-diagram project)

If you're working with the main app-state-diagram project, you can use alps2dot directly through composer:

```bash
# Show usage information
composer alps2dot

# Convert ALPS to DOT
composer alps2dot docs/bookstore/alps.xml

# Generate title-based labels
composer alps2dot docs/amazon/alps.json --title

# Generate both ID and title versions
composer alps2dot docs/lms/alps.xml --both

# Run demo comparisons with PHP version
composer alps2dot-demo
```

## Features

### Strict Validation

TypeScript version provides strict ALPS validation that catches data quality issues:

- **Duplicate ID Detection**: Prevents ALPS documents with duplicate descriptor IDs
- **Reference Validation**: Validates href references and semantic consistency
- **Early Error Detection**: Catches issues that might be missed in less strict implementations

### PHP Compatibility

This TypeScript implementation generates DOT output that is fully compatible with the PHP version of app-state-diagram:

- **Semantic Field Nodes**: Nodes with semantic descriptors and fields (margin=0.1)
- **Transition Edges**: HTML table-formatted labels with colored type symbols
- **App State Nodes**: Basic state nodes for application flow
- **Label Strategies**: ID-based and title-based labeling matching PHP behavior

### Output Structure

Generated DOT files follow this structure:

```dot
digraph application_state_diagram {
  graph [labelloc="t"; fontname="Helvetica"];
  node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];

  // Semantic field nodes (margin=0.1)
  State1 [margin=0.1, label="State1\\nfield1\\nfield2", shape=box, URL="#State1" target="_parent"]
  
  // Transition edges with HTML labels
  State1 -> State2 [label=<<table>...</table>> URL="#transition" target="_parent" fontsize=13 class="transition" penwidth=1.5];
  
  // Basic app state nodes  
  State1 [label="State1" URL="#State1" target="_parent"]
}
```

### Type Symbols

Transition types are visualized with colored Unicode squares:

- 🟢 **Safe** transitions: Green square (`#00A86B`)
- 🔴 **Unsafe** transitions: Red square (`#FF4136`) 
- 🟡 **Idempotent** transitions: Yellow square (`#FFDC00`)
- ⚫ **Other** transitions: Black square (`#000000`)

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Development mode
npm run dev <alps-file>
```

## Related Projects

- [app-state-diagram](https://github.com/alps-asd/app-state-diagram) - PHP version and main project
- [ALPS](https://alps.io/) - Application-Level Profile Semantics specification

## License

MIT

## Author

Akihito Koriyama <akihito.koriyama@gmail.com>
