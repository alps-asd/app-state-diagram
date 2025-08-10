import { IdLabelStrategy, TitleLabelStrategy } from '../../src/generator/label-strategy';
import { InternalNode, InternalLink } from '../../src/types/internal';

describe('Label Strategies', () => {
  describe('IdLabelStrategy', () => {
    let strategy: IdLabelStrategy;

    beforeEach(() => {
      strategy = new IdLabelStrategy();
    });

    test('should use node ID as label', () => {
      const node: InternalNode = {
        id: 'userProfile',
        type: 'semantic',
        semanticFields: [],
        title: 'User Profile Page'
      };

      const label = strategy.getNodeLabel(node);
      expect(label).toBe('userProfile');
    });

    test('should use transition ID for link labels', () => {
      const link: InternalLink = {
        from: 'home',
        to: 'profile',
        transitionId: 'goToProfile',
        transitionTitle: 'Go to Profile',
        relation: 'profile'
      };

      const label = strategy.getLinkLabel(link.transitionId || '', link.transitionTitle);
      expect(label).toBe('goToProfile');
    });

    test('should fallback to relation for link without transition ID', () => {
      const link: InternalLink = {
        from: 'home',
        to: 'profile',
        relation: 'profile'
      };

      const label = strategy.getLinkLabel(link.relation || '');
      expect(label).toBe('profile');
    });

    test('should return empty string when no ID or relation', () => {
      const link: InternalLink = {
        from: 'home',
        to: 'profile'
      };

      const label = strategy.getLinkLabel('');
      expect(label).toBe('');
    });
  });

  describe('TitleLabelStrategy', () => {
    let strategy: TitleLabelStrategy;

    beforeEach(() => {
      strategy = new TitleLabelStrategy();
    });

    test('should use node title as label when available', () => {
      const node: InternalNode = {
        id: 'userProfile',
        type: 'semantic',
        semanticFields: [],
        title: 'User Profile Page'
      };

      const label = strategy.getNodeLabel(node);
      expect(label).toBe('User Profile Page');
    });

    test('should fallback to ID when no title', () => {
      const node: InternalNode = {
        id: 'userProfile',
        type: 'semantic',
        semanticFields: []
      };

      const label = strategy.getNodeLabel(node);
      expect(label).toBe('userProfile');
    });

    test('should use transition title for link labels when available', () => {
      const link: InternalLink = {
        from: 'home',
        to: 'profile',
        transitionId: 'goToProfile',
        transitionTitle: 'Go to User Profile',
        relation: 'profile'
      };

      const label = strategy.getLinkLabel(link.transitionId || '', link.transitionTitle);
      expect(label).toBe('Go&nbsp;to&nbsp;User&nbsp;Profile');
    });

    test('should fallback to transition ID when no title', () => {
      const link: InternalLink = {
        from: 'home',
        to: 'profile',
        transitionId: 'goToProfile',
        relation: 'profile'
      };

      const label = strategy.getLinkLabel(link.transitionId || '');
      expect(label).toBe('goToProfile');
    });

    test('should fallback to relation when no title or ID', () => {
      const link: InternalLink = {
        from: 'home',
        to: 'profile',
        relation: 'profile'
      };

      const label = strategy.getLinkLabel(link.relation || '');
      expect(label).toBe('profile');
    });

    test('should handle empty titles', () => {
      const node: InternalNode = {
        id: 'test',
        type: 'semantic',
        semanticFields: [],
        title: ''
      };

      const label = strategy.getNodeLabel(node);
      expect(label).toBe('test');
    });
  });
});