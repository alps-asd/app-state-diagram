# App State Diagram (TypeScript)

A command-line tool to generate HTML documentation and state diagrams from [ALPS](http://alps.io/) (Application-Level Profile Semantics) profiles.

## Features

- Parse JSON and XML ALPS profiles
- Validate ALPS documents with detailed error/warning messages
- Generate interactive HTML documentation with:
  - State diagrams (via Graphviz WASM)
  - Semantic descriptor tables
  - Tag filtering
  - Link navigation
- Output formats: HTML, SVG, DOT
- External file reference resolution

## Installation

```bash
git clone https://github.com/alps-asd/app-state-diagram.git
cd app-state-diagram
git checkout ts
npm install
npm run build
npm link
```

## Usage

### Generate HTML Documentation

```bash
# Generate HTML (default) - includes validation
asd profile.json

# Specify output file
asd profile.xml -o documentation.html

# Output to stdout
asd profile.json --echo
```

### Generate Diagram Only

```bash
# Generate SVG diagram
asd profile.json -f svg

# Generate DOT format (Graphviz)
asd profile.json -f dot -o diagram.dot
```

### Validate Only

```bash
# Validate and output results as JSON (no HTML generation)
asd profile.json --validate
```

## Output Example

The generated HTML includes:

1. **Title and Description** - From ALPS `title` and `doc` elements
2. **State Diagram** - Interactive SVG showing application states and transitions
3. **Descriptor Table** - All semantic descriptors with:
   - Type indicator (semantic/safe/unsafe/idempotent)
   - ID and title
   - Contained descriptors
   - Extra info (def, rt, rel, doc, tags)
4. **Legend** - Color coding for descriptor types
5. **Links** - External links from ALPS `link` elements

## Validation

The validator checks for:

### Errors (prevent generation)
- `E001` - Missing id or href
- `E002` - Missing rt (return type) for transitions
- `E003` - Invalid type value
- `E004` - Broken reference (href/rt pointing to non-existent id)
- `E005` - Duplicate id
- `E006` - Invalid href format
- `E007` - Invalid rt format
- `E008` - Missing alps property
- `E009` - Missing descriptor array
- `E010` - Invalid XML characters in title
- `E011` - Tag must be string (not array)

### Warnings
- `W001` - Missing title attribute
- `W002` - Safe transitions should start with "go"
- `W003` - Unsafe/idempotent transitions should start with "do"
- `W004` - Orphan descriptor (defined but never referenced)

### Suggestions
- `S001` - Consider adding doc to transitions
- `S002` - Consider adding title to ALPS document
- `S003` - Consider adding doc to ALPS document

## Programmatic Usage

```typescript
import {
  AlpsParser,
  AlpsTransformer,
  DotGenerator,
  HtmlGenerator,
  dotToSvg
} from '@alps-asd/asd';

// Parse ALPS document
const parser = new AlpsParser();
const document = parser.parse(alpsContent);

// Validate
const validation = parser.validate(document);
if (!validation.isValid) {
  console.error(validation.errors);
  process.exit(1);
}

// Transform to internal model
const transformer = new AlpsTransformer();
const model = transformer.transform(document);

// Generate DOT
const dotGenerator = new DotGenerator();
const dot = dotGenerator.generate(model);

// Convert to SVG
const svg = await dotToSvg(dot);

// Generate HTML
const htmlGenerator = new HtmlGenerator();
const html = htmlGenerator.generate(document, svg, alpsContent);
```

## Requirements

- Node.js 18.0.0 or higher

## Related Projects

- [ALPS Specification](http://alps.io/)
- [app-state-diagram](https://github.com/alps-asd/app-state-diagram) - PHP implementation
- [alps-editor](https://github.com/alps-asd/alps-editor) - Online ALPS editor

## License

MIT