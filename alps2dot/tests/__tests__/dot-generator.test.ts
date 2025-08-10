import { DotGenerator } from '../../src/generator/dot-generator';
import { TitleLabelStrategy } from '../../src/generator/label-strategy';
import { InternalModel, InternalNode, InternalLink } from '../../src/types/internal';

describe('DotGenerator', () => {
  let generator: DotGenerator;

  beforeEach(() => {
    generator = new DotGenerator();
  });

  describe('generate', () => {
    it('should generate basic DOT output with ID labels (default)', () => {
      const model: InternalModel = {
        title: 'Test API',
        nodes: [
          {
            id: 'home',
            type: 'safe',
            title: 'Home',
            description: 'Home page',
            isTransition: true,
            semanticFields: []
          }
        ],
        links: []
      };

      const result = generator.generate(model);

      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('home [');
      expect(result).toContain('label="home"'); // ID labels by default
      expect(result).toContain('fillcolor="lightblue"');
      expect(result).toContain('Test API');
    });

    it('should generate DOT output with title labels when using TitleLabelStrategy', () => {
      const titleGenerator = new DotGenerator(new TitleLabelStrategy());
      const model: InternalModel = {
        nodes: [
          {
            id: 'home',
            type: 'safe',
            title: 'Home Page',
            isTransition: true,
            semanticFields: []
          }
        ],
        links: []
      };

      const result = titleGenerator.generate(model);

      expect(result).toContain('label="Home Page"'); // Title labels
    });

    it('should generate nodes with different types', () => {
      const model: InternalModel = {
        nodes: [
          {
            id: 'safe_action',
            type: 'safe',
            isTransition: true,
            semanticFields: []
          },
          {
            id: 'unsafe_action',
            type: 'unsafe',
            isTransition: true,
            semanticFields: []
          },
          {
            id: 'idempotent_action',
            type: 'idempotent',
            isTransition: true,
            semanticFields: []
          },
          {
            id: 'semantic_field',
            type: 'semantic',
            isTransition: false,
            semanticFields: []
          }
        ],
        links: []
      };

      const result = generator.generate(model);

      expect(result).toContain('fillcolor="lightblue"'); // safe
      expect(result).toContain('fillcolor="lightcoral"'); // unsafe
      expect(result).toContain('fillcolor="lightgreen"'); // idempotent
      expect(result).toContain('fillcolor="lightgray"'); // semantic
    });

    it('should generate nodes with semantic fields', () => {
      const model: InternalModel = {
        nodes: [
          {
            id: 'blog_post',
            type: 'safe',
            title: 'Blog Post',
            isTransition: true,
            semanticFields: ['title', 'content', 'author']
          }
        ],
        links: []
      };

      const result = generator.generate(model);

      // Default generator uses ID labels + semantic fields
      expect(result).toContain('blog_post\\\\ntitle\\\\ncontent\\\\nauthor');
    });

    it('should generate edges with correct attributes', () => {
      const model: InternalModel = {
        nodes: [
          {
            id: 'home',
            type: 'safe',
            isTransition: true,
            semanticFields: []
          },
          {
            id: 'about',
            type: 'safe',
            isTransition: true,
            semanticFields: []
          }
        ],
        links: [
          {
            from: 'home',
            to: 'about',
            type: 'transition'
          },
          {
            from: 'home',
            to: 'about',
            type: 'reference',
            relation: 'related'
          }
        ]
      };

      const result = generator.generate(model);

      expect(result).toContain('home -> about');
      expect(result).toContain('style="solid"'); // transition
      expect(result).toContain('style="dashed"'); // reference
      expect(result).toContain('label="related"');
    });

    it('should escape special characters in IDs and labels', () => {
      const titleGenerator = new DotGenerator(new TitleLabelStrategy());
      const model: InternalModel = {
        nodes: [
          {
            id: 'special-id',
            type: 'safe',
            title: 'Title with "quotes" and \n newlines',
            isTransition: true,
            semanticFields: []
          }
        ],
        links: []
      };

      const result = titleGenerator.generate(model);

      expect(result).toContain('"special-id"');
      expect(result).toContain('Title with \\"quotes\\" and \\n newlines');
    });

    it('should handle empty model', () => {
      const model: InternalModel = {
        nodes: [],
        links: []
      };

      const result = generator.generate(model);

      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('}');
      expect(result).toContain('node [shape=box');
    });

    it('should generate proper DOT syntax', () => {
      const model: InternalModel = {
        title: 'Sample API',
        nodes: [
          {
            id: 'home',
            type: 'safe',
            title: 'Home',
            isTransition: true,
            semanticFields: ['id', 'name']
          },
          {
            id: 'blog',
            type: 'safe',
            title: 'Blog',
            isTransition: true,
            semanticFields: []
          }
        ],
        links: [
          {
            from: 'home',
            to: 'blog',
            type: 'transition'
          }
        ]
      };

      const result = generator.generate(model);

      // Check overall structure
      expect(result.trim()).toMatch(/^digraph application_state_diagram \{[\s\S]*\}$/);
      
      // Check graph attributes
      expect(result).toContain('graph [');
      expect(result).toContain('rankdir="TB"');
      expect(result).toContain('labelloc="t"');
      
      // Check nodes are properly formatted
      expect(result).toMatch(/home \[[\s\S]*?\];/);
      expect(result).toMatch(/blog \[[\s\S]*?\];/);
      
      // Check edge is properly formatted
      expect(result).toMatch(/home -> blog/);
    });
  });
});