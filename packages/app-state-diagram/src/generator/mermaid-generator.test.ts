import { generateMermaid } from './mermaid-generator';
import { AlpsDocument } from '../parser/alps-parser';

describe('MermaidGenerator', () => {
  describe('generateMermaid', () => {
    it('should generate valid classDiagram structure', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('classDiagram');
      expect(mermaid).toContain('class Home');
    });

    it('should create class definitions from rt targets', () => {
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
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('class Home');
      expect(mermaid).toContain('class About');
    });

    it('should use correct emojis for descriptor types', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [
                { href: '#goSafe' },
                { href: '#doUnsafe' },
                { href: '#doIdempotent' },
                { href: '#semantic' }
              ]
            },
            { id: 'goSafe', type: 'safe', rt: '#Home' },
            { id: 'doUnsafe', type: 'unsafe', rt: '#Home' },
            { id: 'doIdempotent', type: 'idempotent', rt: '#Home' },
            { id: 'semantic' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('🟩 goSafe'); // safe - green
      expect(mermaid).toContain('🟥 doUnsafe'); // unsafe - red
      expect(mermaid).toContain('🟨 doIdempotent'); // idempotent - yellow
      expect(mermaid).toContain('⬜ semantic'); // semantic - white
    });

    it('should sort descriptors by type: semantic, safe, unsafe, idempotent', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [
                { href: '#doUnsafe' },
                { href: '#semantic' },
                { href: '#doIdempotent' },
                { href: '#goSafe' }
              ]
            },
            { id: 'goSafe', type: 'safe', rt: '#Home' },
            { id: 'doUnsafe', type: 'unsafe', rt: '#Home' },
            { id: 'doIdempotent', type: 'idempotent', rt: '#Home' },
            { id: 'semantic' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      // Extract the class Home content
      const homeMatch = mermaid.match(/class Home \{([^}]+)\}/);
      expect(homeMatch).not.toBeNull();
      const homeContent = homeMatch![1];

      // Check order: semantic first, then safe, unsafe, idempotent
      const semanticIndex = homeContent.indexOf('⬜ semantic');
      const safeIndex = homeContent.indexOf('🟩 goSafe');
      const unsafeIndex = homeContent.indexOf('🟥 doUnsafe');
      const idempotentIndex = homeContent.indexOf('🟨 doIdempotent');

      expect(semanticIndex).toBeLessThan(safeIndex);
      expect(safeIndex).toBeLessThan(unsafeIndex);
      expect(unsafeIndex).toBeLessThan(idempotentIndex);
    });

    it('should generate transitions with emojis', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [{ href: '#goAbout' }]
            },
            { id: 'About' },
            { id: 'goAbout', type: 'safe', rt: '#About' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('Home --> About : 🟩 goAbout');
    });

    it('should handle empty descriptor array', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('classDiagram');
    });

    it('should handle missing alps property', () => {
      const alps = {} as AlpsDocument;
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('classDiagram');
    });

    it('should not generate transition for UnknownState source', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).not.toContain('UnknownState');
    });

    it('should handle descriptors with inline children (id instead of href)', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [
                { id: 'inlineChild' }
              ]
            },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('⬜ inlineChild');
    });

    it('should ignore transitions without id', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { type: 'safe', rt: '#Home' } // no id
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).not.toContain('-->');
    });

    it('should ignore transitions without rt', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goNoRt', type: 'safe' } // no rt
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).not.toContain('goNoRt');
    });

    it('should handle state without children', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'EmptyState' },
            { id: 'goEmpty', type: 'safe', rt: '#EmptyState' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('class EmptyState {');
      expect(mermaid).toContain('}');
    });

    it('should handle unknown descriptor type as semantic', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [{ href: '#unknown' }]
            },
            { id: 'unknown', type: 'custom' as any },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('⬜ unknown');
    });

    it('should fall back to semantic descriptors when no transitions exist', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'State1', type: 'semantic' },
            { id: 'State2', type: 'semantic' },
            { id: 'notSemantic', type: 'safe' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      expect(mermaid).toContain('class State1');
      expect(mermaid).toContain('class State2');
    });

    it('should handle child descriptor without id or href', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [
                {} // no id or href
              ]
            },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      // Should not crash, class should be empty
      expect(mermaid).toContain('class Home');
    });

    it('should handle state without id', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { type: 'semantic' }, // no id
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const mermaid = generateMermaid(alps);

      // Should not crash
      expect(mermaid).toContain('class Home');
    });
  });
});
