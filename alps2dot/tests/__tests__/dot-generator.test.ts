import { DotGenerator } from '../../src/generator/dot-generator';
import { IdLabelStrategy, TitleLabelStrategy } from '../../src/generator/label-strategy';
import { InternalModel, InternalNode, InternalLink } from '../../src/types/internal';

describe('DotGenerator', () => {
  let generator: DotGenerator;

  beforeEach(() => {
    generator = new DotGenerator();
  });

  describe('basic generation', () => {
    test('should generate DOT structure', () => {
      const model: InternalModel = {
        title: 'Test API',
        description: 'Test description',
        nodes: [],
        links: []
      };

      const result = generator.generate(model);
      
      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('graph [');
      expect(result).toContain('labelloc="t"');
      expect(result).toContain('fontname="Helvetica"');
      expect(result).toContain('node [');
    });

    test('should handle empty model', () => {
      const model: InternalModel = {
        nodes: [],
        links: []
      };

      const result = generator.generate(model);
      
      expect(result).toContain('digraph application_state_diagram');
      expect(result).toContain('}');
    });
  });

  describe('node generation', () => {
    test('should generate semantic field nodes', () => {
      const model: InternalModel = {
        nodes: [
          {
            id: 'User',
            type: 'semantic',
            semanticFields: ['name', 'email'],
            title: 'User Profile'
          }
        ],
        links: [
          {
            from: 'Home',
            to: 'User',
            relation: 'user',
            transitionType: 'safe'
          }
        ]
      };

      const result = generator.generate(model);
      
      // Should contain semantic field node with margin=0.1
      expect(result).toContain('User [margin=0.1');
      expect(result).toContain('shape=box');
      expect(result).toContain('URL="#User"');
    });

    test('should use label strategy for node labels', () => {
      const model: InternalModel = {
        nodes: [
          {
            id: 'home',
            type: 'semantic',
            semanticFields: ['field1'],
            title: 'Home Page'
          }
        ],
        links: [
          {
            from: 'start',
            to: 'home',
            relation: 'navigate'
          }
        ]
      };

      // Test with ID strategy
      const idResult = generator.generate(model);
      expect(idResult).toContain('label="home"');

      // Test with Title strategy
      const titleGenerator = new DotGenerator(new TitleLabelStrategy());
      const titleResult = titleGenerator.generate(model);
      expect(titleResult).toContain('label="Home Page"');
    });
  });

  describe('edge generation', () => {
    test('should generate edges with HTML table labels', () => {
      const model: InternalModel = {
        nodes: [
          { id: 'home', type: 'semantic', semanticFields: [] },
          { id: 'about', type: 'semantic', semanticFields: [] }
        ],
        links: [
          {
            from: 'home',
            to: 'about',
            relation: 'about',
            transitionId: 'goToAbout',
            transitionType: 'safe',
            transitionTitle: 'Go to About Page'
          }
        ]
      };

      const result = generator.generate(model);
      
      expect(result).toContain('home -> about');
      expect(result).toContain('<table border="0"');
      expect(result).toContain('goToAbout');
      expect(result).toContain('penwidth=1.5');
    });

    test('should group multiple edges between same nodes', () => {
      const model: InternalModel = {
        nodes: [
          { id: 'home', type: 'semantic', semanticFields: [] },
          { id: 'user', type: 'semantic', semanticFields: [] }
        ],
        links: [
          {
            from: 'home',
            to: 'user',
            relation: 'view',
            transitionId: 'viewUser',
            transitionType: 'safe'
          },
          {
            from: 'home',
            to: 'user',
            relation: 'edit',
            transitionId: 'editUser',
            transitionType: 'unsafe'
          }
        ]
      };

      const result = generator.generate(model);
      
      // Should contain both transitions in one edge
      expect(result).toContain('viewUser');
      expect(result).toContain('editUser');
      
      // Should only have one edge definition
      const edges = result.match(/home -> user/g);
      expect(edges).toHaveLength(1);
    });

    test('should use colored type symbols', () => {
      const model: InternalModel = {
        nodes: [
          { id: 'home', type: 'semantic', semanticFields: [] },
          { id: 'target', type: 'semantic', semanticFields: [] }
        ],
        links: [
          {
            from: 'home',
            to: 'target',
            transitionType: 'safe',
            transitionId: 'safeAction'
          }
        ]
      };

      const result = generator.generate(model);
      
      // Should contain green square for safe transitions
      expect(result).toContain('color="#00A86B"');
    });
  });

  describe('app state nodes', () => {
    test('should generate app state nodes for linked nodes', () => {
      const model: InternalModel = {
        nodes: [
          { id: 'Home', type: 'semantic', semanticFields: [], title: 'Home Page' },
          { id: 'About', type: 'semantic', semanticFields: [], title: 'About Page' }
        ],
        links: [
          {
            from: 'Home',
            to: 'About',
            relation: 'navigate'
          }
        ]
      };

      const result = generator.generate(model);
      
      // Should contain basic app state nodes
      expect(result).toContain('Home [label="Home"');
      expect(result).toContain('About [label="About"');
      expect(result).toContain('URL="#Home"');
      expect(result).toContain('URL="#About"');
    });
  });

  describe('special characters handling', () => {
    test('should escape special characters in labels', () => {
      const model: InternalModel = {
        nodes: [
          { 
            id: 'test', 
            type: 'semantic', 
            semanticFields: [],
            title: 'Title with "quotes" and \n newlines'
          }
        ],
        links: [
          {
            from: 'start',
            to: 'test',
            relation: 'navigate'
          }
        ]
      };

      const titleGenerator = new DotGenerator(new TitleLabelStrategy());
      const result = titleGenerator.generate(model);
      
      // Should properly escape quotes and newlines
      expect(result).toContain('\\"');
      expect(result).toContain('\\n');
    });
  });
});