import { AlpsParser } from '../../src/parser/alps-parser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('AlpsParser', () => {
  let parser: AlpsParser;

  beforeEach(() => {
    parser = new AlpsParser();
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON ALPS document', () => {
      const json = `{
        "alps": {
          "title": "Test API",
          "doc": { "value": "Test description" },
          "descriptor": [
            {
              "id": "home",
              "type": "safe",
              "doc": { "value": "Home state" }
            }
          ]
        }
      }`;

      const result = parser.parse(json, 'json');
      
      expect(result.alps.title).toBe('Test API');
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].id).toBe('home');
      expect(result.alps.descriptor[0].type).toBe('safe');
    });

    it('should handle nested descriptors', () => {
      const json = `{
        "alps": {
          "descriptor": [
            {
              "id": "blog",
              "type": "safe",
              "descriptor": [
                {
                  "href": "#post"
                },
                {
                  "id": "title",
                  "type": "semantic"
                }
              ]
            }
          ]
        }
      }`;

      const result = parser.parse(json, 'json');
      
      expect(result.alps.descriptor[0].descriptor).toHaveLength(2);
      expect(result.alps.descriptor[0].descriptor![0].href).toBe('#post');
      expect(result.alps.descriptor[0].descriptor![1].id).toBe('title');
    });

    it('should normalize single descriptor to array', () => {
      const json = `{
        "alps": {
          "descriptor": {
            "id": "single",
            "type": "safe"
          }
        }
      }`;

      const result = parser.parse(json, 'json');
      
      expect(Array.isArray(result.alps.descriptor)).toBe(true);
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].id).toBe('single');
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => parser.parse(invalidJson, 'json')).toThrow('Invalid JSON');
    });

    it('should throw error for missing alps property', () => {
      const json = '{ "other": "property" }';

      expect(() => parser.parse(json, 'json')).toThrow('Invalid ALPS document: missing alps property');
    });
  });

  describe('XML parsing', () => {
    it('should parse valid XML ALPS document', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <alps>
          <title>Test API</title>
          <doc value="Test description" />
          <descriptor id="home" type="safe">
            <doc value="Home state" />
          </descriptor>
        </alps>`;

      const result = parser.parse(xml, 'xml');
      
      expect(result.alps.title).toBe('Test API');
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].id).toBe('home');
      expect(result.alps.descriptor[0].type).toBe('safe');
    });

    it('should throw error for invalid XML', () => {
      const invalidXml = '<invalid><unclosed>';

      expect(() => parser.parse(invalidXml, 'xml')).toThrow('Invalid XML');
    });

    it('should throw error for missing alps element', () => {
      const xml = '<?xml version="1.0"?><other></other>';

      expect(() => parser.parse(xml, 'xml')).toThrow('Invalid ALPS document: missing alps element');
    });
  });

  describe('Format detection', () => {
    it('should detect JSON format', () => {
      const json = '{ "alps": { "descriptor": [] } }';
      const result = parser.parse(json);
      
      expect(result.alps.descriptor).toEqual([]);
    });

    it('should detect XML format', () => {
      const xml = '<?xml version="1.0"?><alps><descriptor id="test" /></alps>';
      const result = parser.parse(xml);
      
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].id).toBe('test');
    });

    it('should throw error for undetectable format', () => {
      const unknown = 'plain text content';

      expect(() => parser.parse(unknown)).toThrow('Cannot detect format');
    });
  });

  describe('Validation', () => {
    it('should validate correct ALPS document', () => {
      const document = {
        alps: {
          descriptor: [
            { id: 'home', type: 'safe' as const },
            { id: 'about', type: 'safe' as const }
          ]
        }
      };

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing alps property', () => {
      const document = {} as any;

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing alps property');
    });

    it('should detect missing descriptor array', () => {
      const document = {
        alps: {}
      } as any;

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ALPS document must have descriptor array');
    });

    it('should detect descriptor without id or href', () => {
      const document = {
        alps: {
          descriptor: [
            { type: 'safe' as const }
          ]
        }
      };

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('descriptor must have either id or href');
    });

    it('should detect duplicate IDs', () => {
      const document = {
        alps: {
          descriptor: [
            { id: 'duplicate', type: 'safe' as const },
            { id: 'duplicate', type: 'unsafe' as const }
          ]
        }
      };

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("duplicate id 'duplicate'");
    });

    it('should detect invalid type', () => {
      const document = {
        alps: {
          descriptor: [
            { id: 'test', type: 'invalid' as any }
          ]
        }
      };

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("invalid type 'invalid'");
    });

    it('should detect invalid href format', () => {
      const document = {
        alps: {
          descriptor: [
            { href: '#' }
          ]
        }
      };

      const result = parser.validate(document);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("href cannot be just '#'");
    });
  });

  describe('Real file parsing', () => {
    it('should parse sample input file', () => {
      const samplePath = join(__dirname, '../../examples/sample-input.json');
      const content = readFileSync(samplePath, 'utf-8');
      
      const result = parser.parse(content);
      const validation = parser.validate(result);
      
      expect(validation.isValid).toBe(true);
      expect(result.alps.descriptor.length).toBeGreaterThan(0);
      
      // Check specific elements from the sample
      const homeDescriptor = result.alps.descriptor.find(d => d.id === 'home');
      expect(homeDescriptor).toBeDefined();
      expect(homeDescriptor?.type).toBe('safe');
    });
  });
});