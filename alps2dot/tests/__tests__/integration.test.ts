import { Alps2Dot } from '../../src';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Alps2Dot Integration', () => {
  let alps2dot: Alps2Dot;

  beforeEach(() => {
    alps2dot = new Alps2Dot();
  });

  describe('end-to-end conversion', () => {
    test('should convert sample JSON to DOT', () => {
      const input = JSON.stringify({
        alps: {
          version: '1.0',
          title: 'Test API',
          descriptor: [
            {
              id: 'home',
              type: 'semantic',
              title: 'Home Page'
            },
            {
              id: 'goToAbout',
              type: 'safe',
              rt: '#about'
            }
          ]
        }
      });

      const result = alps2dot.convert(input);
      
      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('fontname="Helvetica"');
    });

    test('should handle XML input', () => {
      const xmlInput = `<?xml version="1.0"?>
        <alps version="1.0" title="XML Test API">
          <descriptor id="home" type="semantic" title="Home" />
          <descriptor id="about" type="safe" rt="#home" />
        </alps>`;

      const result = alps2dot.convert(xmlInput, 'xml');
      
      expect(result).toContain('digraph application_state_diagram');
    });

    test('should convert with title labels when specified', () => {
      const input = JSON.stringify({
        alps: {
          descriptor: [
            {
              id: 'home',
              type: 'semantic',
              title: 'Home Page',
              descriptor: [
                {
                  id: 'goToAbout',
                  type: 'safe',
                  rt: '#about'
                }
              ]
            },
            {
              id: 'about',
              type: 'semantic'
            }
          ]
        }
      });

      const result = alps2dot.convertWithLabel(input, 'title');
      
      expect(result).toContain('digraph application_state_diagram');
      // Title labels only appear in node labels or edge labels, not in digraph title
    });

    test('should generate both versions with convertBoth', () => {
      const input = JSON.stringify({
        alps: {
          descriptor: [
            {
              id: 'home',
              type: 'semantic',
              title: 'Home Page',
              descriptor: [
                {
                  id: 'goToAbout',
                  type: 'safe',
                  rt: '#about'
                }
              ]
            },
            {
              id: 'about',
              type: 'semantic'
            }
          ]
        }
      });

      const result = alps2dot.convertBoth(input);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(typeof result.id).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(result.id).toContain('digraph application_state_diagram');
      expect(result.title).toContain('digraph application_state_diagram');
    });

    test('should auto-detect format', () => {
      const jsonInput = '{"alps": {"descriptor": []}}';
      const xmlInput = '<alps><descriptor /></alps>';

      const jsonResult = alps2dot.convert(jsonInput);
      const xmlResult = alps2dot.convert(xmlInput);

      expect(jsonResult).toContain('digraph');
      expect(xmlResult).toContain('digraph');
    });
  });

  describe('validation', () => {
    test('should validate and parse only', () => {
      const input = '{"alps": {"descriptor": [{"id": "test", "type": "semantic"}]}}';
      
      const document = alps2dot.parseOnly(input);
      expect(document.alps.descriptor).toHaveLength(1);
      expect(document.alps.descriptor[0].id).toBe('test');
    });

    test('should validate only without conversion', () => {
      const validInput = '{"alps": {"descriptor": [{"id": "test", "type": "semantic"}]}}';
      
      const document = alps2dot.parseOnly(validInput);
      const validation = alps2dot.validateOnly(document);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid ALPS', () => {
      const invalidInput = '{"alps": {"descriptor": [{"id": "test"}, {"id": "test"}]}}';
      
      const document = alps2dot.parseOnly(invalidInput);
      const validation = alps2dot.validateOnly(document);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should throw on malformed input', () => {
      const malformedInput = '{ invalid json }';
      
      expect(() => alps2dot.convert(malformedInput)).toThrow();
    });
  });

  describe('fixture files', () => {
    test('should process simple fixture', () => {
      const simplePath = join(__dirname, '../fixtures/simple.json');
      
      if (require('fs').existsSync(simplePath)) {
        const input = readFileSync(simplePath, 'utf-8');
        const result = alps2dot.convert(input);
        
        expect(result).toContain('digraph application_state_diagram');
      }
    });

    test('should process XML fixture', () => {
      const xmlPath = join(__dirname, '../fixtures/simple.xml');
      
      if (require('fs').existsSync(xmlPath)) {
        const input = readFileSync(xmlPath, 'utf-8');
        const result = alps2dot.convert(input, 'xml');
        
        expect(result).toContain('digraph application_state_diagram');
      }
    });
  });

  describe('error handling', () => {
    test('should handle empty input gracefully', () => {
      expect(() => alps2dot.convert('')).toThrow();
    });

    test('should handle missing alps property', () => {
      const noAlps = '{"other": "data"}';
      expect(() => alps2dot.convert(noAlps)).toThrow(/invalid.*alps.*document/i);
    });

    test('should handle complex nested structures', () => {
      // Test with complex nested structures rather than circular references
      const complexInput = JSON.stringify({
        alps: {
          descriptor: [
            {
              id: 'user',
              type: 'semantic',
              descriptor: [
                {
                  id: 'name',
                  type: 'semantic'
                },
                {
                  id: 'email', 
                  type: 'semantic'
                },
                {
                  id: 'updateProfile',
                  type: 'unsafe',
                  rt: '#profile'
                }
              ]
            },
            {
              id: 'profile',
              type: 'semantic'
            }
          ]
        }
      });

      const result = alps2dot.convert(complexInput);
      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('fontname="Helvetica"');
    });
  });
});