import { Alps2Dot } from '../../src';

describe('Alps2Dot Basic Tests', () => {
  const alps2dot = new Alps2Dot();

  test('should create instance', () => {
    expect(alps2dot).toBeDefined();
  });

  test('should convert simple ALPS JSON', () => {
    const alpsJson = `{
      "alps": {
        "version": "1.0",
        "descriptor": [
          {
            "id": "home",
            "type": "semantic",
            "title": "Home Page"
          }
        ]
      }
    }`;

    const result = alps2dot.convert(alpsJson);
    expect(result).toContain('digraph application_state_diagram');
    expect(result).toContain('graph [');
    expect(result).toContain('node [');
  });

  test('should validate ALPS document', () => {
    const invalidAlps = '{"invalid": "json"}';
    
    expect(() => {
      alps2dot.convert(invalidAlps);
    }).toThrow();
  });

  test('should generate both ID and title versions', () => {
    const alpsJson = `{
      "alps": {
        "version": "1.0",
        "descriptor": [
          {
            "id": "home",
            "type": "semantic",
            "title": "Home Page"
          }
        ]
      }
    }`;

    const result = alps2dot.convertBoth(alpsJson);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(typeof result.id).toBe('string');
    expect(typeof result.title).toBe('string');
  });
});