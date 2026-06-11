import {
  parseAlps,
  parseAlpsAuto,
  docText,
  localFragment,
  walkDescriptors,
  findDescriptorById,
} from './alps-parser';
import type { AlpsDescriptor } from './alps-parser';

describe('parseAlpsAuto', () => {
  it('parses JSON profiles', () => {
    const doc = parseAlpsAuto('{"alps": {"title": "T", "descriptor": [{"id": "x"}]}}');
    expect(doc.alps.title).toBe('T');
    expect(doc.alps.descriptor?.[0].id).toBe('x');
  });

  it('parses XML doc text content', () => {
    const doc = parseAlpsAuto(
      '<alps><descriptor id="x"><doc>hello</doc></descriptor></alps>'
    );
    expect(docText(doc.alps.descriptor?.[0].doc)).toBe('hello');
  });

  it('parses XML doc href and format attributes', () => {
    const doc = parseAlpsAuto(
      '<alps><descriptor id="x"><doc href="alps-doc/x.md" format="markdown"/></descriptor></alps>'
    );
    expect(doc.alps.descriptor?.[0].doc).toEqual({ href: 'alps-doc/x.md', format: 'markdown' });
  });

  it('parses XML root docs, links, and nested descriptor references', () => {
    const doc = parseAlpsAuto(`
      <alps>
        <title>Store</title>
        <doc href="README.md" format="markdown" contentType="text/markdown">Overview</doc>
        <link rel="help" href="help.html" title="Help"/>
        <descriptor id="Home" type="semantic" tag="page-home" def="def" rel="self" href="#Home">
          <descriptor href="#goCart"/>
        </descriptor>
        <descriptor id="goCart" type="safe" rt="#Cart"/>
      </alps>
    `);

    expect(doc.alps.title).toBe('Store');
    expect(doc.alps.doc).toEqual({
      value: 'Overview',
      href: 'README.md',
      format: 'markdown',
      contentType: 'text/markdown',
    });
    expect(doc.alps.link).toEqual([{ rel: 'help', href: 'help.html', title: 'Help' }]);
    expect(doc.alps.descriptor?.[0]).toMatchObject({
      id: 'Home',
      type: 'semantic',
      tag: 'page-home',
      def: 'def',
      rel: 'self',
      href: '#Home',
      descriptor: [{ href: '#goCart' }],
    });
  });

  it('throws readable parse errors', () => {
    expect(() => parseAlps('{', 'JSON')).toThrow('Invalid JSON format');
    expect(() => parseAlps('<not-alps/>', 'XML')).toThrow('No alps element found');
  });
});

describe('docText', () => {
  it('handles string, object, and undefined forms', () => {
    expect(docText('plain')).toBe('plain');
    expect(docText({ value: 'v' })).toBe('v');
    expect(docText({ href: 'x.md' })).toBe('');
    expect(docText(undefined)).toBe('');
  });
});

describe('localFragment', () => {
  it('extracts local fragment ids', () => {
    expect(localFragment('#Home')).toBe('Home');
  });

  it('returns null for external and missing references', () => {
    expect(localFragment('other.json#Home')).toBeNull();
    expect(localFragment('http://example.com/alps#Home')).toBeNull();
    expect(localFragment(undefined)).toBeNull();
  });
});

describe('walkDescriptors', () => {
  it('visits nested descriptors depth-first', () => {
    const descriptors: AlpsDescriptor[] = [
      { id: 'a', descriptor: [{ id: 'b', descriptor: [{ id: 'c' }] }] },
      { id: 'd' },
    ];
    const visited: (string | undefined)[] = [];
    walkDescriptors(descriptors, desc => visited.push(desc.id));
    expect(visited).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('findDescriptorById', () => {
  const descriptors = [
    { id: 'a', descriptor: [{ id: 'b' }] },
    { id: 'c' },
  ];

  it('finds nested descriptors', () => {
    expect(findDescriptorById(descriptors, 'b')).toEqual({ id: 'b' });
  });

  it('returns null for unknown ids and non-array input', () => {
    expect(findDescriptorById(descriptors, 'nope')).toBeNull();
    expect(findDescriptorById(undefined, 'a')).toBeNull();
  });
});
