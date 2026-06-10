import { extractGraph, findPaths, formatPath, findContainers } from './graph';
import type { AlpsDocument } from '../parser/alps-parser';

const DOC: AlpsDocument = {
  alps: {
    title: 'Store',
    descriptor: [
      { id: 'Home', type: 'semantic', descriptor: [{ href: '#goCatalog' }, { href: '#goCart' }] },
      {
        id: 'Catalog',
        type: 'semantic',
        descriptor: [{ href: '#goHome' }, { href: '#doAddToCart' }],
      },
      { id: 'Cart', type: 'semantic', descriptor: [{ href: '#goCheckout' }] },
      { id: 'Checkout', type: 'semantic' },
      { id: 'goCatalog', type: 'safe', rt: '#Catalog' },
      { id: 'goCart', type: 'safe', rt: '#Cart' },
      { id: 'goHome', type: 'safe', rt: '#Home' },
      { id: 'doAddToCart', type: 'unsafe', rt: '#Cart' },
      { id: 'goCheckout', type: 'safe', rt: '#Checkout' },
      { id: 'price', type: 'semantic' },
    ],
  },
};

describe('extractGraph', () => {
  const graph = extractGraph(DOC);

  it('extracts states (rt targets and transition containers)', () => {
    expect(graph.states.map(s => s.id).sort()).toEqual(['Cart', 'Catalog', 'Checkout', 'Home']);
  });

  it('extracts transitions with from/to', () => {
    const addToCart = graph.transitions.find(t => t.id === 'doAddToCart');
    expect(addToCart).toEqual({
      id: 'doAddToCart',
      type: 'unsafe',
      title: undefined,
      from: ['Catalog'],
      to: 'Cart',
    });
  });

  it('does not treat plain semantic descriptors as states', () => {
    expect(graph.states.find(s => s.id === 'price')).toBeUndefined();
  });

  it('excludes transitions with external rt references', () => {
    const doc: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home', type: 'semantic', descriptor: [{ href: '#goExt' }, { href: '#goSelf' }] },
          { id: 'goExt', type: 'safe', rt: 'other.json#Remote' },
          { id: 'goSelf', type: 'safe', rt: '#Home' },
        ],
      },
    };
    const g = extractGraph(doc);
    expect(g.transitions.map(t => t.id)).toEqual(['goSelf']);
    expect(g.states.map(s => s.id)).toEqual(['Home']);
  });
});

describe('findContainers', () => {
  it('finds all containers of a descriptor', () => {
    expect(findContainers('goHome', DOC.alps.descriptor!)).toEqual(['Catalog']);
  });

  it('returns an empty array when not contained', () => {
    expect(findContainers('price', DOC.alps.descriptor!)).toEqual([]);
  });
});

describe('findPaths', () => {
  const graph = extractGraph(DOC);

  it('enumerates all paths between two states', () => {
    const paths = findPaths(graph, 'Home', 'Checkout');
    const formatted = paths.map(p => formatPath('Home', p)).sort();
    expect(formatted).toEqual([
      'Home --goCart(safe)--> Cart --goCheckout(safe)--> Checkout',
      'Home --goCatalog(safe)--> Catalog --doAddToCart(unsafe)--> Cart --goCheckout(safe)--> Checkout',
    ]);
  });

  it('does not revisit states (no infinite loops on cycles)', () => {
    const paths = findPaths(graph, 'Catalog', 'Checkout');
    const formatted = paths.map(p => formatPath('Catalog', p)).sort();
    expect(formatted).toEqual([
      'Catalog --doAddToCart(unsafe)--> Cart --goCheckout(safe)--> Checkout',
      'Catalog --goHome(safe)--> Home --goCart(safe)--> Cart --goCheckout(safe)--> Checkout',
    ]);
  });

  it('returns an empty array when no path exists', () => {
    expect(findPaths(graph, 'Checkout', 'Home')).toEqual([]);
  });

  it('respects maxPaths', () => {
    expect(findPaths(graph, 'Home', 'Checkout', 1).length).toBe(1);
  });
});
