/**
 * MCP Profile Tool Handler Tests
 *
 * Tests the alps_overview, alps_search, alps_descriptor, alps_paths, and
 * alps_set_doc handlers against real temp profile files (no fs mocking,
 * since alps_set_doc writes profiles and external doc files to disk).
 */

const {
  handleAlpsOverview,
  handleAlpsSearch,
  handleAlpsDescriptor,
  handleAlpsPaths,
  handleAlpsSetDoc,
} = require('./index');
const { DOC_DIR } = require('./doc-store');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROFILE = {
  alps: {
    title: 'Store',
    doc: 'Online store profile',
    descriptor: [
      {
        id: 'Home',
        type: 'semantic',
        tag: 'nav',
        descriptor: [{ href: '#goCatalog' }, { href: '#goCart' }],
      },
      {
        id: 'Catalog',
        type: 'semantic',
        tag: 'catalog',
        doc: 'Product catalog page',
        descriptor: [{ href: '#goHome' }, { href: '#doAddToCart' }],
      },
      { id: 'Cart', type: 'semantic', tag: 'cart checkout', descriptor: [{ href: '#goCheckout' }] },
      { id: 'Checkout', type: 'semantic', tag: 'checkout' },
      { id: 'goCatalog', type: 'safe', rt: '#Catalog', tag: 'nav' },
      { id: 'goCart', type: 'safe', rt: '#Cart', tag: 'nav' },
      { id: 'goHome', type: 'safe', rt: '#Home', tag: 'nav' },
      { id: 'doAddToCart', type: 'unsafe', rt: '#Cart', tag: 'cart' },
      { id: 'goCheckout', type: 'safe', rt: '#Checkout', tag: 'checkout' },
      { id: 'price', type: 'semantic' },
    ],
  },
};

let dir: string;
let profilePath: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-tools-'));
  profilePath = path.join(dir, 'profile.json');
  fs.writeFileSync(profilePath, JSON.stringify(PROFILE, null, 2) + '\n');
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const parseResult = (result: { content: { text: string }[] }) =>
  JSON.parse(result.content[0].text);

describe('handleAlpsOverview', () => {
  it('should summarize states, transitions, and tags', async () => {
    const result = await handleAlpsOverview({ file: profilePath });

    expect(result.isError).toBe(false);
    const overview = parseResult(result);
    expect(overview.title).toBe('Store');
    expect(overview.doc).toBe('Online store profile');
    expect(overview.counts).toEqual({ descriptors: 15, states: 4, transitions: 5 });
    expect(overview.states.map((s: { id: string }) => s.id).sort()).toEqual([
      'Cart',
      'Catalog',
      'Checkout',
      'Home',
    ]);
    expect(overview.transitions).toContainEqual({
      id: 'doAddToCart',
      type: 'unsafe',
      from: ['Catalog'],
      to: 'Cart',
    });
    expect(overview.tags).toEqual(['cart', 'catalog', 'checkout', 'nav']);
  });

  it('should read XML profiles', async () => {
    const xmlPath = path.join(dir, 'profile.xml');
    fs.writeFileSync(
      xmlPath,
      `<?xml version="1.0"?>
<alps>
  <descriptor id="Home" type="semantic">
    <descriptor href="#goHome"/>
  </descriptor>
  <descriptor id="goHome" type="safe" rt="#Home"/>
</alps>`
    );

    const result = await handleAlpsOverview({ file: xmlPath });

    expect(result.isError).toBe(false);
    expect(parseResult(result).states.map((s: { id: string }) => s.id)).toEqual(['Home']);
  });

  it('should return error when file is missing', async () => {
    const result = await handleAlpsOverview({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: file is required');
  });

  it('should return error when args is undefined', async () => {
    const result = await handleAlpsOverview(undefined);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: file is required');
  });

  it('should return error when the profile does not exist', async () => {
    const result = await handleAlpsOverview({ file: path.join(dir, 'none.json') });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Profile file not found');
  });
});

describe('handleAlpsSearch', () => {
  it('should filter by type', async () => {
    const result = await handleAlpsSearch({ file: profilePath, type: 'unsafe' });

    expect(result.isError).toBe(false);
    const search = parseResult(result);
    expect(search.count).toBe(1);
    expect(search.descriptors[0]).toMatchObject({ id: 'doAddToCart', type: 'unsafe' });
  });

  it('should filter by tag', async () => {
    const result = await handleAlpsSearch({ file: profilePath, tag: 'cart' });

    expect(parseResult(result).descriptors.map((d: { id: string }) => d.id)).toEqual([
      'Cart',
      'doAddToCart',
    ]);
  });

  it('should search text in id, title, and doc', async () => {
    const result = await handleAlpsSearch({ file: profilePath, text: 'catalog' });

    expect(parseResult(result).descriptors.map((d: { id: string }) => d.id)).toEqual([
      'Catalog',
      'goCatalog',
    ]);
  });

  it('should combine filters', async () => {
    const result = await handleAlpsSearch({ file: profilePath, type: 'safe', tag: 'nav' });

    expect(parseResult(result).descriptors.map((d: { id: string }) => d.id)).toEqual([
      'goCatalog',
      'goCart',
      'goHome',
    ]);
  });

  it('should resolve external href references', async () => {
    fs.writeFileSync(
      path.join(dir, 'shared.json'),
      JSON.stringify({
        alps: { descriptor: [{ id: 'address', type: 'semantic', title: 'Address' }] },
      })
    );
    const profile = {
      alps: { descriptor: [{ href: 'shared.json#address' }] },
    };
    fs.writeFileSync(profilePath, JSON.stringify(profile));

    const result = await handleAlpsSearch({ file: profilePath, text: 'address' });

    expect(parseResult(result).descriptors).toEqual([
      { id: 'address', type: 'semantic', title: 'Address' },
    ]);
  });

  it('should return error when file is missing', async () => {
    const result = await handleAlpsSearch({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: file is required');
  });
});

describe('handleAlpsDescriptor', () => {
  it('should return descriptor details with containers and transitions', async () => {
    const result = await handleAlpsDescriptor({ file: profilePath, id: 'Catalog' });

    expect(result.isError).toBe(false);
    const details = parseResult(result);
    expect(details.descriptor.id).toBe('Catalog');
    expect(details.doc).toEqual({ text: 'Product catalog page' });
    expect(details.containedBy).toEqual([]);
    expect(details.outgoingTransitions).toEqual([
      { id: 'goHome', type: 'safe', to: 'Home' },
      { id: 'doAddToCart', type: 'unsafe', to: 'Cart' },
    ]);
    expect(details.incomingTransitions).toEqual([{ id: 'goCatalog', type: 'safe', from: ['Home'] }]);
  });

  it('should report containing states for transitions', async () => {
    const result = await handleAlpsDescriptor({ file: profilePath, id: 'goCheckout' });

    expect(parseResult(result).containedBy).toEqual(['Cart']);
  });

  it('should resolve external doc files written by alps_set_doc', async () => {
    const doc = '# Catalog\n\nDetailed catalog documentation.';
    await handleAlpsSetDoc({ file: profilePath, id: 'Catalog', doc });

    const result = await handleAlpsDescriptor({ file: profilePath, id: 'Catalog' });

    expect(parseResult(result).doc).toEqual({
      text: doc + '\n',
      href: `${DOC_DIR}/Catalog.md`,
      format: 'markdown',
    });
  });

  it('should return error for unknown descriptor ids', async () => {
    const result = await handleAlpsDescriptor({ file: profilePath, id: 'Nope' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Descriptor not found: Nope');
  });

  it('should return error when file or id is missing', async () => {
    const result = await handleAlpsDescriptor({ file: profilePath });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: file and id are required');
  });
});

describe('handleAlpsPaths', () => {
  it('should enumerate paths between states', async () => {
    const result = await handleAlpsPaths({ file: profilePath, from: 'Home', to: 'Checkout' });

    expect(result.isError).toBe(false);
    const paths = parseResult(result);
    expect(paths.count).toBe(2);
    expect(paths.paths.sort()).toEqual([
      'Home --goCart(safe)--> Cart --goCheckout(safe)--> Checkout',
      'Home --goCatalog(safe)--> Catalog --doAddToCart(unsafe)--> Cart --goCheckout(safe)--> Checkout',
    ]);
  });

  it('should respect maxPaths', async () => {
    const result = await handleAlpsPaths({
      file: profilePath,
      from: 'Home',
      to: 'Checkout',
      maxPaths: 1,
    });

    expect(parseResult(result).count).toBe(1);
  });

  it('should return error for unknown states', async () => {
    const result = await handleAlpsPaths({ file: profilePath, from: 'Nope', to: 'Checkout' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Unknown state: Nope');
  });

  it('should return error when file, from, or to is missing', async () => {
    const result = await handleAlpsPaths({ file: profilePath, from: 'Home' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: file, from, and to are required');
  });
});

describe('handleAlpsSetDoc', () => {
  it('should store short docs inline', async () => {
    const result = await handleAlpsSetDoc({ file: profilePath, id: 'Home', doc: 'Entry point.' });

    expect(result.isError).toBe(false);
    expect(parseResult(result)).toEqual({ id: 'Home', placement: 'inline' });
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
    expect(profile.alps.descriptor[0].doc).toBe('Entry point.');
  });

  it('should externalize multi-line docs to alps/docs', async () => {
    const doc = '# Home\n\nDetailed documentation.';
    const result = await handleAlpsSetDoc({ file: profilePath, id: 'Home', doc });

    expect(parseResult(result)).toEqual({
      id: 'Home',
      placement: 'external',
      docFile: `${DOC_DIR}/Home.md`,
    });
    expect(fs.readFileSync(path.join(dir, DOC_DIR, 'Home.md'), 'utf-8')).toBe(doc + '\n');
  });

  it('should honor explicit placement', async () => {
    const result = await handleAlpsSetDoc({
      file: profilePath,
      id: 'Home',
      doc: 'Short.',
      placement: 'external',
    });

    expect(parseResult(result).placement).toBe('external');
  });

  it('should return error for unknown descriptor ids', async () => {
    const result = await handleAlpsSetDoc({ file: profilePath, id: 'Nope', doc: 'doc' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Descriptor not found: Nope');
  });

  it('should return error when file, id, or doc is missing', async () => {
    const result = await handleAlpsSetDoc({ file: profilePath, id: 'Home' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: file, id, and doc are required');
  });
});
