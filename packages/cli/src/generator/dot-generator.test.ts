import { generateDot, buildRelationshipMap } from './dot-generator';
import type { AlpsDocument } from '../parser/alps-parser';

describe('DotGenerator', () => {
  describe('generateDot', () => {
    it('should generate valid DOT structure', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('digraph application_state_diagram');
      expect(dot).toContain('graph [');
      expect(dot).toContain('node [shape = box');
    });

    it('should create state nodes from rt targets', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'About' },
            { id: 'goHome', type: 'safe', rt: '#Home' },
            { id: 'goAbout', type: 'safe', rt: '#About' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('Home [');
      expect(dot).toContain('About [');
    });

    it('should not create state nodes for non-rt-targeted descriptors', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'NotAState' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('Home [');
      expect(dot).not.toMatch(/NotAState \[/);
    });

    it('should generate transitions with correct colors', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goSafe', type: 'safe', rt: '#Home' },
            { id: 'doUnsafe', type: 'unsafe', rt: '#Home' },
            { id: 'doIdempotent', type: 'idempotent', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('color="#00A86B"'); // safe - green
      expect(dot).toContain('color="#FF4136"'); // unsafe - red
      expect(dot).toContain('color="#D4A000"'); // idempotent - yellow
    });

    it('should use id as label by default', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'HomePage', title: 'Home Page Title' },
            { id: 'goHome', type: 'safe', rt: '#HomePage', title: 'Go Home' }
          ]
        }
      };
      const dot = generateDot(alps, 'id');

      expect(dot).toContain('label="HomePage"');
      expect(dot).toContain('label="goHome"');
    });

    it('should use title as label when labelMode is title', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'HomePage', title: 'Home Page Title' },
            { id: 'goHome', type: 'safe', rt: '#HomePage', title: 'Go Home' }
          ]
        }
      };
      const dot = generateDot(alps, 'title');

      expect(dot).toContain('label="Home Page Title"');
      expect(dot).toContain('label="Go Home"');
    });

    it('should fall back to id when title is missing', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'HomePage' },
            { id: 'goHome', type: 'safe', rt: '#HomePage' }
          ]
        }
      };
      const dot = generateDot(alps, 'title');

      expect(dot).toContain('label="HomePage"');
      expect(dot).toContain('label="goHome"');
    });

    it('should find source states for transitions', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [
                { href: '#goAbout' }
              ]
            },
            { id: 'About' },
            { id: 'goAbout', type: 'safe', rt: '#About' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('Home -> About');
    });

    it('should use UnknownState when source not found', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('UnknownState -> Home');
    });

    it('should handle empty descriptor array', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('digraph application_state_diagram');
      expect(dot).toContain('}');
    });

    it('should handle missing alps property', () => {
      const alps = {} as AlpsDocument;
      const dot = generateDot(alps);

      expect(dot).toContain('digraph application_state_diagram');
    });

    it('should include URL attributes for navigation', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('URL="#Home"');
      expect(dot).toContain('URL="#goHome"');
    });
  });

  describe('buildRelationshipMap', () => {
    it('should build parent-child relationships', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Parent',
              descriptor: [
                { id: 'child1' },
                { href: '#child2' }
              ]
            },
            { id: 'child2' }
          ]
        }
      };
      const map = buildRelationshipMap(alps);

      expect(map.childrenOf['Parent']).toContain('child1');
      expect(map.childrenOf['Parent']).toContain('child2');
      expect(map.parentOf['child1']).toContain('Parent');
      expect(map.parentOf['child2']).toContain('Parent');
    });

    it('should handle empty descriptor', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };
      const map = buildRelationshipMap(alps);

      expect(map.parentOf).toEqual({});
      expect(map.childrenOf).toEqual({});
    });

    it('should handle descriptors without children', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Lonely' }
          ]
        }
      };
      const map = buildRelationshipMap(alps);

      expect(map.childrenOf['Lonely']).toBeUndefined();
    });
  });
});
