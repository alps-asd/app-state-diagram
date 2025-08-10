import { AlpsTransformer } from '../../src/parser/transformer';
import { AlpsDocument } from '../../src/types/alps';

describe('AlpsTransformer', () => {
  let transformer: AlpsTransformer;

  beforeEach(() => {
    transformer = new AlpsTransformer();
  });

  describe('basic transformation', () => {
    test('should transform simple ALPS document', () => {
      const document: AlpsDocument = {
        alps: {
          version: '1.0',
          title: 'Test API',
          descriptor: [
            {
              id: 'home',
              type: 'semantic',
              title: 'Home Page'
            }
          ]
        }
      };

      const result = transformer.transform(document);
      
      expect(result.title).toBe('Test API');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('home');
      expect(result.nodes[0].title).toBe('Home Page');
    });

    test('should handle empty descriptor array', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };

      const result = transformer.transform(document);
      
      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });
  });

  describe('reference resolution', () => {
    test('should resolve href references', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'home',
              type: 'semantic'
            },
            {
              href: '#home',
              type: 'safe'
            }
          ]
        }
      };

      const result = transformer.transform(document);
      
      expect(result.nodes).toHaveLength(1);
      // Only the original 'home' node should exist, href reference doesn't create a duplicate
      expect(result.nodes[0].id).toBe('home');
    });

    test('should handle unknown href gracefully', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: [
            {
              href: '#nonexistent',
              type: 'safe'
            }
          ]
        }
      };

      const result = transformer.transform(document);
      
      expect(result.nodes).toHaveLength(0);
      // Unknown href references don't create nodes since they're not resolved
    });

    test('should handle multiple independent descriptors', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'home',
              type: 'semantic'
            },
            {
              id: 'about',
              type: 'semantic'
            }
          ]
        }
      };

      // Should create separate nodes for independent descriptors
      const result = transformer.transform(document);
      expect(result.nodes).toHaveLength(2);
      expect(result.links).toHaveLength(0);
    });
  });

  describe('unidentifiable descriptors', () => {
    test('should not create nodes for descriptors without id or href', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: [
            {
              type: 'semantic'
              // No id or href
            },
            {
              type: 'safe'
              // No id or href  
            }
          ]
        }
      };

      const result = transformer.transform(document);
      
      expect(result.nodes).toHaveLength(0);
      // Descriptors without id or href cannot be resolved and don't create nodes
    });
  });

  describe('nested descriptors', () => {
    test('should handle nested descriptors', () => {
      const document: AlpsDocument = {
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
                }
              ]
            }
          ]
        }
      };

      const result = transformer.transform(document);
      
      // Should flatten nested descriptors
      expect(result.nodes.length).toBeGreaterThanOrEqual(1);
      const userNode = result.nodes.find(n => n.id === 'user');
      expect(userNode).toBeDefined();
      expect(userNode?.semanticFields).toContain('name');
      expect(userNode?.semanticFields).toContain('email');
    });
  });

  describe('link creation', () => {
    test('should create links from nested transitions', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'home',
              type: 'semantic',
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
      };

      const result = transformer.transform(document);
      
      expect(result.links).toHaveLength(1);
      expect(result.links[0].transitionId).toBe('goToAbout');
      expect(result.links[0].to).toBe('about');
      expect(result.links[0].transitionType).toBe('safe');
      expect(result.links[0].from).toBe('home');
    });

    test('should handle multiple transitions', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'state1',
              type: 'semantic',
              descriptor: [
                {
                  id: 'action1',
                  type: 'safe',
                  rt: '#state2'
                },
                {
                  id: 'action2',
                  type: 'unsafe',
                  rt: '#state3'
                }
              ]
            },
            {
              id: 'state2', 
              type: 'semantic'
            },
            {
              id: 'state3',
              type: 'semantic'
            }
          ]
        }
      };

      const result = transformer.transform(document);
      
      expect(result.links).toHaveLength(2);
      expect(result.links.map(l => l.transitionType)).toContain('safe');
      expect(result.links.map(l => l.transitionType)).toContain('unsafe');
    });
  });

  describe('documentation extraction', () => {
    test('should extract documentation from doc property', () => {
      const document: AlpsDocument = {
        alps: {
          doc: { value: 'API Documentation' },
          descriptor: []
        }
      };

      const result = transformer.transform(document);
      
      expect(result.description).toBe('API Documentation');
    });

    test('should handle string documentation', () => {
      const document: AlpsDocument = {
        alps: {
          doc: 'Simple documentation',
          descriptor: []
        }
      };

      const result = transformer.transform(document);
      
      expect(result.description).toBe('Simple documentation');
    });

    test('should handle missing documentation', () => {
      const document: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };

      const result = transformer.transform(document);
      
      expect(result.description).toBeUndefined();
    });
  });
});