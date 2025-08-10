import { IdLabelStrategy, TitleLabelStrategy, createLabelStrategy } from '../../src/generator/label-strategy';
import { InternalNode } from '../../src/types/internal';

describe('LabelStrategy', () => {
  describe('IdLabelStrategy', () => {
    it('should return node ID as label', () => {
      const strategy = new IdLabelStrategy();
      const node: InternalNode = {
        id: 'test-node',
        type: 'semantic',
        title: 'Test Node Title',
        isTransition: false,
        semanticFields: []
      };

      expect(strategy.getNodeLabel(node)).toBe('test-node');
    });

    it('should return transition ID as link label', () => {
      const strategy = new IdLabelStrategy();
      expect(strategy.getLinkLabel('test-trans', 'Test Transition')).toBe('test-trans');
    });
  });

  describe('TitleLabelStrategy', () => {
    it('should return node title as label, fallback to ID', () => {
      const strategy = new TitleLabelStrategy();
      
      const nodeWithTitle: InternalNode = {
        id: 'test-node',
        type: 'semantic', 
        title: 'Test Node Title',
        isTransition: false,
        semanticFields: []
      };

      const nodeWithoutTitle: InternalNode = {
        id: 'test-node',
        type: 'semantic',
        isTransition: false,
        semanticFields: []
      };

      expect(strategy.getNodeLabel(nodeWithTitle)).toBe('Test Node Title');
      expect(strategy.getNodeLabel(nodeWithoutTitle)).toBe('test-node');
    });

    it('should return transition title as link label with &nbsp; replacement', () => {
      const strategy = new TitleLabelStrategy();
      expect(strategy.getLinkLabel('test-trans', 'Test Transition Title')).toBe('Test&nbsp;Transition&nbsp;Title');
      expect(strategy.getLinkLabel('test-trans')).toBe('test-trans');
    });
  });

  describe('createLabelStrategy', () => {
    it('should create ID strategy', () => {
      const strategy = createLabelStrategy('id');
      expect(strategy).toBeInstanceOf(IdLabelStrategy);
    });

    it('should create title strategy', () => {
      const strategy = createLabelStrategy('title');
      expect(strategy).toBeInstanceOf(TitleLabelStrategy);
    });
  });
});