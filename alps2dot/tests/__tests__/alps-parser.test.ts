import { AlpsParser } from '../../src/parser/alps-parser';

describe('AlpsParser', () => {
  let parser: AlpsParser;

  beforeEach(() => {
    parser = new AlpsParser();
  });

  describe('JSON parsing', () => {
    test('should parse valid ALPS JSON', () => {
      const alpsJson = `{
        "alps": {
          "version": "1.0",
          "title": "Test API",
          "descriptor": [
            {
              "id": "home",
              "type": "semantic",
              "title": "Home Page"
            }
          ]
        }
      }`;

      const result = parser.parse(alpsJson);
      expect(result.alps.version).toBe('1.0');
      expect(result.alps.title).toBe('Test API');
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].id).toBe('home');
    });

    test('should handle single descriptor as array', () => {
      const alpsJson = `{
        "alps": {
          "descriptor": {
            "id": "home",
            "type": "semantic"
          }
        }
      }`;

      const result = parser.parse(alpsJson);
      expect(Array.isArray(result.alps.descriptor)).toBe(true);
      expect(result.alps.descriptor).toHaveLength(1);
    });

    test('should normalize documentation', () => {
      const alpsJson = `{
        "alps": {
          "doc": "Simple documentation",
          "descriptor": []
        }
      }`;

      const result = parser.parse(alpsJson);
      expect(result.alps.doc).toEqual({ value: 'Simple documentation' });
    });

    test('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      expect(() => parser.parse(invalidJson)).toThrow('Invalid JSON');
    });

    test('should throw error for missing alps property', () => {
      const noAlpsJson = '{ "other": "data" }';
      expect(() => parser.parse(noAlpsJson)).toThrow('Invalid ALPS document: missing alps property');
    });
  });

  describe('XML parsing', () => {
    test('should parse valid ALPS XML', () => {
      const alpsXml = `<?xml version="1.0"?>
        <alps version="1.0">
          <title>Test API</title>
          <descriptor id="home" type="semantic" title="Home Page" />
        </alps>`;

      const result = parser.parse(alpsXml);
      expect(result.alps.version).toBe('1.0');
      expect(result.alps.title).toBe('Test API');
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].id).toBe('home');
    });

    test('should handle nested descriptors', () => {
      const alpsXml = `<?xml version="1.0"?>
        <alps>
          <descriptor id="user" type="semantic">
            <descriptor id="name" type="semantic" />
            <descriptor id="email" type="semantic" />
          </descriptor>
        </alps>`;

      const result = parser.parse(alpsXml);
      expect(result.alps.descriptor).toHaveLength(1);
      expect(result.alps.descriptor[0].descriptor).toHaveLength(2);
    });
  });

  describe('format detection', () => {
    test('should auto-detect JSON format', () => {
      const alpsJson = '{"alps": {"descriptor": []}}';
      const result = parser.parse(alpsJson);
      expect(result.alps.descriptor).toEqual([]);
    });

    test('should auto-detect XML format', () => {
      const alpsXml = '<alps><descriptor id="test" /></alps>';
      const result = parser.parse(alpsXml);
      expect(result.alps.descriptor).toHaveLength(1);
    });

    test('should throw error for undetectable format', () => {
      const invalidContent = 'neither json nor xml';
      expect(() => parser.parse(invalidContent)).toThrow('Cannot detect format');
    });
  });

  describe('validation', () => {
    test('should validate valid ALPS document', () => {
      const alpsJson = '{"alps": {"descriptor": [{"id": "test", "type": "semantic"}]}}';
      const document = parser.parse(alpsJson);
      const validation = parser.validate(document);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect duplicate IDs', () => {
      const alpsJson = `{
        "alps": {
          "descriptor": [
            {"id": "test", "type": "semantic"},
            {"id": "test", "type": "safe"}
          ]
        }
      }`;
      
      const document = parser.parse(alpsJson);
      const validation = parser.validate(document);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('duplicate'))).toBe(true);
    });

    test('should accept missing optional fields', () => {
      const alpsJson = '{"alps": {"descriptor": []}}';
      const document = parser.parse(alpsJson);
      const validation = parser.validate(document);
      
      expect(validation.isValid).toBe(true);
    });
  });
});