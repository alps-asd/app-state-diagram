# @alps-asd/app-state-diagram

CLI tool and programmatic API for generating documentation and diagrams from [ALPS](http://alps.io/) profiles.

## Installation

```bash
npm install @alps-asd/app-state-diagram
```

Or use globally:

```bash
npm install -g @alps-asd/app-state-diagram
```

## CLI Usage

```bash
# Generate HTML documentation
asd profile.json
asd profile.xml -o output.html

# Generate SVG diagram
asd profile.json -m svg

# Generate DOT format (Graphviz)
asd profile.json -m dot

# Validate only
asd profile.json --validate

# Watch mode with live reload
asd -w profile.json

# Merge ALPS profiles
asd merge base.json partial.json
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file path |
| `-m, --mode <mode>` | Output mode: `html`, `svg`, or `dot` |
| `-w, --watch` | Watch mode with live reload |
| `--validate` | Validate only, no output |

### Merge Command

Merge partial ALPS profiles into a base profile:

```bash
asd merge base.json partial.json
```

**How it works:**
1. Merges descriptors from `partial.json` into `base.json`
2. `base.json` is updated with merged result
3. `partial.json` is rewritten to contain only conflicts (or empty if no conflicts)
4. Duplicate descriptors (same ID and definition) are automatically skipped
5. If conflicts exist (same ID, different definition), they remain in `partial.json` for manual resolution

**Workflow:**
```bash
# Merge domain-specific features
asd merge base.json customer-domain.json
# customer-domain.json now empty (successful merge)

# If conflicts occur
asd merge base.json admin-domain.json
# admin-domain.json contains only conflicting descriptors
# Resolve conflicts manually, then re-merge
asd merge base.json admin-domain.json
```

**Benefits:**
- Safe incremental development
- Automatic duplicate detection
- Conflict tracking
- No manual JSON editing

## Programmatic API

### Parser

Parse ALPS profiles from JSON or XML:

```typescript
import { parseAlps, parseAlpsAuto } from '@alps-asd/app-state-diagram/parser/alps-parser.js';

// Parse with explicit format
const docFromJson = parseAlps(jsonContent, 'JSON');
const docFromXml = parseAlps(xmlContent, 'XML');

// Auto-detect format
const doc = parseAlpsAuto(content);
```

#### Types

```typescript
interface AlpsDocument {
  alps: {
    title?: string;
    doc?: string | { value: string };
    descriptor?: AlpsDescriptor[];
    link?: AlpsLink | AlpsLink[];
  };
}

interface AlpsDescriptor {
  id?: string;
  type?: 'semantic' | 'safe' | 'unsafe' | 'idempotent';
  title?: string;
  def?: string;
  doc?: string | { value: string };
  rel?: string;
  rt?: string;
  tag?: string;
  href?: string;
  descriptor?: AlpsDescriptor[];
}
```

### Validator

Validate ALPS profiles:

```typescript
import { AlpsValidator } from '@alps-asd/app-state-diagram/validator/index.js';

const validator = new AlpsValidator();
const result = validator.validate(document);

if (!result.isValid) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
  console.log('Suggestions:', result.suggestions);
}
```

#### Validation Result

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
}

interface ValidationIssue {
  code: string;      // E001, W001, S001, etc.
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  path?: string;     // JSON path to the issue
  id?: string;       // Descriptor id if applicable
}
```

See [Validation Reference](../../dev-docs/validation-reference.md) for details on all validation codes.

### Generator

Generate DOT and SVG from ALPS profiles:

```typescript
import { generateDot } from '@alps-asd/app-state-diagram/generator/dot-generator.js';
import { dotToSvg } from '@alps-asd/app-state-diagram/generator/svg-generator.js';

// Generate DOT format
const dot = generateDot(document);

// Convert DOT to SVG
const svg = await dotToSvg(dot);
```

## Complete Example

```typescript
import { parseAlpsAuto } from '@alps-asd/app-state-diagram/parser/alps-parser.js';
import { AlpsValidator } from '@alps-asd/app-state-diagram/validator/index.js';
import { generateDot } from '@alps-asd/app-state-diagram/generator/dot-generator.js';
import { dotToSvg } from '@alps-asd/app-state-diagram/generator/svg-generator.js';
import fs from 'fs';

// Load and parse
const content = fs.readFileSync('profile.json', 'utf-8');
const document = parseAlpsAuto(content);

// Validate
const validator = new AlpsValidator();
const result = validator.validate(document);

if (!result.isValid) {
  for (const error of result.errors) {
    console.error(`[${error.code}] ${error.message}`);
  }
  process.exit(1);
}

// Generate diagram
const dot = generateDot(document);
const svg = await dotToSvg(dot);
fs.writeFileSync('diagram.svg', svg);
```

## Dependencies

- [@viz-js/viz](https://github.com/nickg/viz-js) - Graphviz WASM for SVG generation
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - XML parsing
- [chokidar](https://github.com/paulmillr/chokidar) - File watching
- [chrome-remote-interface](https://github.com/nickg/chrome-remote-interface) - CDP for live reload

## License

MIT
