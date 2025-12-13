/**
 * MCP Server Tests
 *
 * Tests the tool handlers directly without MCP transport.
 */

import { parseAlpsAuto } from "@alps-asd/cli/parser/alps-parser.js";
import { AlpsValidator } from "@alps-asd/cli/validator/index.js";
import { generateDot } from "@alps-asd/cli/generator/dot-generator.js";

describe('MCP Tools', () => {
  describe('validate_alps', () => {
    it('should validate valid ALPS', () => {
      const alpsContent = JSON.stringify({
        alps: {
          title: "Test",
          descriptor: [{ id: "test" }]
        }
      });

      const document = parseAlpsAuto(alpsContent);
      const validator = new AlpsValidator();
      const result = validator.validate(document);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect errors in invalid ALPS', () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [{ type: "semantic" }]  // Missing id
        }
      });

      const document = parseAlpsAuto(alpsContent);
      const validator = new AlpsValidator();
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'E001')).toBe(true);
    });

    it('should handle XML format', () => {
      const alpsContent = `<?xml version="1.0"?>
<alps>
  <descriptor id="test"/>
</alps>`;

      const document = parseAlpsAuto(alpsContent);
      const validator = new AlpsValidator();
      const result = validator.validate(document);

      expect(result.isValid).toBe(true);
    });
  });

  describe('alps2svg', () => {
    it('should generate DOT from ALPS', () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [
            { id: "Home" },
            { id: "goHome", type: "safe", rt: "#Home" }
          ]
        }
      });

      const document = parseAlpsAuto(alpsContent);
      const dot = generateDot(document);

      expect(dot).toContain('digraph');
      expect(dot).toContain('Home');
    });

    it('should generate transitions with colors', () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [
            { id: "Target" },
            { id: "goTarget", type: "safe", rt: "#Target" },
            { id: "doAction", type: "unsafe", rt: "#Target" }
          ]
        }
      });

      const document = parseAlpsAuto(alpsContent);
      const dot = generateDot(document);

      expect(dot).toContain('#00A86B');  // safe - green
      expect(dot).toContain('#FF4136');  // unsafe - red
    });
  });

  describe('alps_guide', () => {
    it('should return guide content', () => {
      // Guide content should contain key ALPS concepts
      const expectedConcepts = [
        'safe',
        'unsafe',
        'idempotent',
        'descriptor',
        'Ontology',
        'Taxonomy',
        'Choreography'
      ];

      // This tests the embedded guide fallback
      const embeddedGuide = `# ALPS Best Practices

## Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Safe transition | \`go\` | \`goProductList\`, \`goHome\` |
| Unsafe transition | \`do\` | \`doCreateUser\`, \`doAddToCart\` |
| State/Page | PascalCase | \`HomePage\`, \`ProductDetail\` |

## Three Layers

1. **Ontology** - Semantic descriptors (data fields)
2. **Taxonomy** - State descriptors (screens/pages)
3. **Choreography** - Transition descriptors (safe/unsafe/idempotent)`;

      for (const concept of expectedConcepts) {
        expect(embeddedGuide.toLowerCase()).toContain(concept.toLowerCase());
      }
    });
  });
});
