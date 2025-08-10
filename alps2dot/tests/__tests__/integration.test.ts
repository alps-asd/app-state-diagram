import { Alps2Dot } from '../../src/index';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Alps2Dot Integration', () => {
  let alps2dot: Alps2Dot;

  beforeEach(() => {
    alps2dot = new Alps2Dot();
  });

  describe('end-to-end conversion', () => {
    it('should convert sample JSON to DOT with ID labels (default)', () => {
      const samplePath = join(__dirname, '../../examples/sample-input.json');
      const input = readFileSync(samplePath, 'utf-8');

      const result = alps2dot.convert(input);

      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('home [');
      expect(result).toContain('blog [');
      expect(result).toContain('post [');
      expect(result).toContain('about [');
      
      // Check labels are IDs (not titles)
      expect(result).toContain('label="home"');
      expect(result).toContain('label="blog"');
      
      // Check for transitions
      expect(result).toContain('home -> blog');
      expect(result).toContain('home -> about');
      expect(result).toContain('blog -> post');
      
      // Check for different node types
      expect(result).toContain('fillcolor="lightblue"'); // safe
      expect(result).toContain('fillcolor="lightcoral"'); // unsafe
      expect(result).toContain('fillcolor="lightgreen"'); // idempotent
      expect(result).toContain('fillcolor="lightgray"'); // semantic
    });

    it('should convert with title labels when specified', () => {
      const input = `{
        "alps": {
          "descriptor": [
            {
              "id": "home",
              "type": "safe",
              "title": "Home Page"
            },
            {
              "id": "about", 
              "type": "safe"
            }
          ]
        }
      }`;

      const result = alps2dot.convertWithLabel(input, 'title');

      expect(result).toContain('label="Home Page"'); // title used
      expect(result).toContain('label="about"');     // fallback to ID
    });

    it('should generate both versions with convertBoth', () => {
      const input = `{
        "alps": {
          "descriptor": [
            {
              "id": "home",
              "type": "safe",
              "title": "Home Page"
            }
          ]
        }
      }`;

      const result = alps2dot.convertBoth(input);

      expect(result.id).toContain('label="home"');
      expect(result.title).toContain('label="Home Page"');
      expect(typeof result.id).toBe('string');
      expect(typeof result.title).toBe('string');
    });

    it('should handle XML input', () => {
      const xmlInput = `<?xml version="1.0" encoding="UTF-8"?>
        <alps>
          <title>XML Test API</title>
          <descriptor id="home" type="safe">
            <doc value="Home page" />
            <descriptor href="#about" />
          </descriptor>
          <descriptor id="about" type="safe">
            <doc value="About page" />
          </descriptor>
        </alps>`;

      const result = alps2dot.convert(xmlInput);

      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('XML Test API');
      expect(result).toContain('home [');
      expect(result).toContain('about [');
      expect(result).toContain('home -> about');
    });

    it('should validate input and throw on invalid document', () => {
      const invalidInput = `{
        "alps": {
          "descriptor": [
            {
              "type": "safe"
            }
          ]
        }
      }`;

      expect(() => alps2dot.convert(invalidInput)).toThrow('Invalid ALPS document');
    });

    it('should handle complex nested structures', () => {
      const complexInput = `{
        "alps": {
          "title": "Complex API",
          "descriptor": [
            {
              "id": "blog",
              "type": "safe",
              "descriptor": [
                {
                  "id": "title",
                  "type": "semantic"
                },
                {
                  "id": "content",
                  "type": "semantic"
                },
                {
                  "href": "#create-post"
                }
              ]
            },
            {
              "id": "create-post",
              "type": "unsafe",
              "descriptor": [
                {
                  "href": "#title"
                },
                {
                  "href": "#content"
                }
              ]
            }
          ]
        }
      }`;

      const result = alps2dot.convert(complexInput);

      expect(result).toContain('blog [');
      expect(result).toContain('"create-post" [');
      expect(result).toContain('blog -> "create-post"');
      expect(result).toContain('title\\\\ncontent'); // semantic fields
    });
  });

  describe('parseOnly', () => {
    it('should parse without validation', () => {
      const input = '{ "alps": { "descriptor": [] } }';
      
      const result = alps2dot.parseOnly(input);
      
      expect(result.alps.descriptor).toEqual([]);
    });
  });

  describe('validateOnly', () => {
    it('should validate parsed document', () => {
      const document = {
        alps: {
          descriptor: [
            { id: 'test', type: 'safe' as const }
          ]
        }
      };

      const result = alps2dot.validateOnly(document);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors', () => {
      const document = {
        alps: {
          descriptor: [
            { type: 'safe' as const } // missing id or href
          ]
        }
      };

      const result = alps2dot.validateOnly(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle ALPS with external references', () => {
      const input = `{
        "alps": {
          "descriptor": [
            {
              "id": "home",
              "type": "safe",
              "descriptor": [
                {
                  "href": "http://example.com/profile#external"
                },
                {
                  "href": "#local"
                }
              ]
            },
            {
              "id": "local",
              "type": "safe"
            }
          ]
        }
      }`;

      const result = alps2dot.convert(input);

      expect(result).toContain('home [');
      expect(result).toContain('local [');
      expect(result).toContain('home -> local');
    });

    it('should handle ALPS without transitions', () => {
      const input = `{
        "alps": {
          "descriptor": [
            {
              "id": "title",
              "type": "semantic"
            },
            {
              "id": "content",
              "type": "semantic"
            }
          ]
        }
      }`;

      const result = alps2dot.convert(input);

      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('title [');
      expect(result).toContain('content [');
      expect(result).toContain('fillcolor="lightgray"'); // semantic nodes
    });

    it('should generate valid DOT that could be processed by Graphviz', () => {
      const samplePath = join(__dirname, '../../examples/sample-input.json');
      const input = readFileSync(samplePath, 'utf-8');

      const result = alps2dot.convert(input);

      // Basic DOT syntax validation
      expect(result).toMatch(/^digraph \w+ \{/);
      expect(result.trim()).toMatch(/\}$/);
      
      // Check that all nodes are properly closed
      const nodeMatches = result.match(/\w+ \[/g);
      const nodeClosures = result.match(/\];/g);
      
      if (nodeMatches && nodeClosures) {
        // Should have at least as many closures as node declarations
        expect(nodeClosures.length).toBeGreaterThanOrEqual(nodeMatches.length);
      }
      
      // Check that edges are properly formatted
      const edgeMatches = result.match(/\w+ -> \w+/g);
      if (edgeMatches) {
        expect(edgeMatches.length).toBeGreaterThan(0);
      }
    });
  });
});