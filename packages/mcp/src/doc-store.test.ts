/**
 * Doc Store Tests
 *
 * Tests inline/external doc placement, raw-JSON editing, and doc.href
 * containment (including symlink escapes) against real temp directories.
 */

const {
  setDescriptorDoc,
  resolveDoc,
  resolveSafeLocalPath,
  shouldExternalize,
  INLINE_DOC_MAX_LENGTH,
  DOC_DIR,
} = require('./doc-store');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROFILE = {
  alps: {
    title: 'Test',
    descriptor: [
      {
        id: 'Home',
        type: 'semantic',
        descriptor: [{ href: '#goCatalog' }, { id: 'greeting', type: 'semantic' }],
      },
      { id: 'Catalog', type: 'semantic', doc: { value: 'old doc', format: 'text' } },
      { id: 'goCatalog', type: 'safe', rt: '#Catalog' },
    ],
  },
};

let dir: string;
let profilePath: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-store-'));
  profilePath = path.join(dir, 'profile.json');
  fs.writeFileSync(profilePath, JSON.stringify(PROFILE, null, 2) + '\n');
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const readProfile = () => JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

describe('shouldExternalize', () => {
  it('keeps short single-line docs inline', () => {
    expect(shouldExternalize('Short doc')).toBe(false);
  });

  it('externalizes long docs', () => {
    expect(shouldExternalize('a'.repeat(INLINE_DOC_MAX_LENGTH + 1))).toBe(true);
  });

  it('externalizes multi-line docs', () => {
    expect(shouldExternalize('# Title\n\nBody')).toBe(true);
  });
});

describe('setDescriptorDoc', () => {
  it('stores a short doc inline as a string', () => {
    const result = setDescriptorDoc(profilePath, 'Home', 'Entry point.');
    expect(result).toEqual({ id: 'Home', placement: 'inline' });
    expect(readProfile().alps.descriptor[0].doc).toBe('Entry point.');
  });

  it('preserves object form when updating an existing inline doc', () => {
    setDescriptorDoc(profilePath, 'Catalog', 'new doc');
    expect(readProfile().alps.descriptor[1].doc).toEqual({ value: 'new doc', format: 'text' });
  });

  it('stores a large doc in an external alps/docs file linked via doc.href', () => {
    const doc = '# Home\n\nDetailed documentation.\n\n- rule 1\n- rule 2';
    const result = setDescriptorDoc(profilePath, 'Home', doc);
    expect(result.placement).toBe('external');
    expect(result.docFile).toBe(`${DOC_DIR}/Home.md`);
    expect(readProfile().alps.descriptor[0].doc).toEqual({
      href: `${DOC_DIR}/Home.md`,
      format: 'markdown',
    });
    expect(fs.readFileSync(path.join(dir, DOC_DIR, 'Home.md'), 'utf-8')).toBe(doc + '\n');
  });

  it('keeps an existing external doc external on auto, even for short docs', () => {
    setDescriptorDoc(profilePath, 'Home', '# Long\n\ndoc');
    const result = setDescriptorDoc(profilePath, 'Home', 'Now short.');
    expect(result.placement).toBe('external');
    expect(fs.readFileSync(path.join(dir, DOC_DIR, 'Home.md'), 'utf-8')).toBe('Now short.\n');
  });

  it('updates a custom local doc.href in place, preserving its format', () => {
    const profile = {
      alps: {
        descriptor: [
          { id: 'Home', type: 'semantic', doc: { href: 'docs/home.txt', format: 'text' } },
        ],
      },
    };
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    const result = setDescriptorDoc(profilePath, 'Home', 'Updated doc.');
    expect(result).toEqual({ id: 'Home', placement: 'external', docFile: 'docs/home.txt' });
    expect(fs.readFileSync(path.join(dir, 'docs/home.txt'), 'utf-8')).toBe('Updated doc.\n');
    expect(readProfile().alps.descriptor[0].doc).toEqual({
      href: 'docs/home.txt',
      format: 'text',
    });
  });

  it('forces inline placement and reports the orphaned doc file', () => {
    setDescriptorDoc(profilePath, 'Home', '# Long\n\ndoc');
    const result = setDescriptorDoc(profilePath, 'Home', 'Inline now.', 'inline');
    expect(result).toEqual({
      id: 'Home',
      placement: 'inline',
      orphanedDocFile: `${DOC_DIR}/Home.md`,
    });
    expect(readProfile().alps.descriptor[0].doc).toBe('Inline now.');
    expect(fs.existsSync(path.join(dir, DOC_DIR, 'Home.md'))).toBe(true);
  });

  it('forces external placement for short docs', () => {
    const result = setDescriptorDoc(profilePath, 'Home', 'Short.', 'external');
    expect(result.placement).toBe('external');
    expect(result.docFile).toBe(`${DOC_DIR}/Home.md`);
  });

  it('does not add a second newline when writing external docs', () => {
    const result = setDescriptorDoc(profilePath, 'Home', 'Already newline\n', 'external');

    expect(result.docFile).toBe(`${DOC_DIR}/Home.md`);
    expect(fs.readFileSync(path.join(dir, DOC_DIR, 'Home.md'), 'utf-8')).toBe('Already newline\n');
  });

  it('updates nested descriptors', () => {
    setDescriptorDoc(profilePath, 'greeting', 'A greeting.');
    expect(readProfile().alps.descriptor[0].descriptor[1].doc).toBe('A greeting.');
  });

  it('sanitizes descriptor ids in file names', () => {
    const profile = { alps: { descriptor: [{ id: 'a/b c', type: 'semantic' }] } };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    const result = setDescriptorDoc(profilePath, 'a/b c', 'x\ny');
    expect(result.docFile).toBe(`${DOC_DIR}/a-b-c.md`);
  });

  it('preserves the original indentation', () => {
    fs.writeFileSync(profilePath, JSON.stringify(PROFILE, null, 4) + '\n');
    setDescriptorDoc(profilePath, 'Home', 'Doc.');
    const content = fs.readFileSync(profilePath, 'utf-8');
    expect(content).toContain('\n    "alps"');
    expect(content.endsWith('\n')).toBe(true);
  });

  it('writes through symlinks that stay inside the profile directory', () => {
    fs.mkdirSync(path.join(dir, 'real-docs'));
    fs.symlinkSync(path.join(dir, 'real-docs'), path.join(dir, 'linkdocs'));
    const profile = {
      alps: { descriptor: [{ id: 'Home', type: 'semantic', doc: { href: 'linkdocs/home.md' } }] },
    };
    fs.writeFileSync(profilePath, JSON.stringify(profile));
    const result = setDescriptorDoc(profilePath, 'Home', 'Linked doc.');
    expect(result).toEqual({ id: 'Home', placement: 'external', docFile: 'linkdocs/home.md' });
    expect(fs.readFileSync(path.join(dir, 'real-docs', 'home.md'), 'utf-8')).toBe('Linked doc.\n');
  });

  it('rejects writes through symlinks escaping the profile directory', () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-store-outside-'));
    try {
      fs.symlinkSync(outside, path.join(dir, 'alps'));
      expect(() => setDescriptorDoc(profilePath, 'Home', 'x\ny')).toThrow('Unsafe doc path');
      expect(fs.readdirSync(outside)).toEqual([]);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it('does not reuse unsafe existing doc.href values as write targets', () => {
    const unsafeHrefs = ['../escape.md', '/etc/escape.md', 'file:///etc/escape.md', 'a\\b.md'];
    for (const href of unsafeHrefs) {
      const profile = {
        alps: { descriptor: [{ id: 'Home', type: 'semantic', doc: { href } }] },
      };
      fs.writeFileSync(profilePath, JSON.stringify(profile));
      const result = setDescriptorDoc(profilePath, 'Home', 'x\ny');
      expect(result.docFile).toBe(`${DOC_DIR}/Home.md`);
      expect(fs.existsSync(path.join(dir, '..', 'escape.md'))).toBe(false);
    }
  });

  it('rejects unknown descriptor ids', () => {
    expect(() => setDescriptorDoc(profilePath, 'Nope', 'doc')).toThrow('Descriptor not found');
  });

  it('writes XML profiles', () => {
    const xmlPath = path.join(dir, 'profile.xml');
    fs.writeFileSync(xmlPath, '<alps><descriptor id="Home"/></alps>');
    expect(setDescriptorDoc(xmlPath, 'Home', 'doc')).toEqual({ id: 'Home', placement: 'inline' });
    expect(fs.readFileSync(xmlPath, 'utf-8')).toContain('<doc>doc</doc>');
  });

  it('rejects missing files', () => {
    expect(() => setDescriptorDoc(path.join(dir, 'none.json'), 'Home', 'doc')).toThrow(
      'Profile file not found'
    );
  });

  it('rejects invalid JSON profiles', () => {
    fs.writeFileSync(profilePath, '{');
    expect(() => setDescriptorDoc(profilePath, 'Home', 'doc')).toThrow('Invalid JSON format');
  });
});

describe('resolveDoc', () => {
  it('resolves inline string docs', () => {
    expect(resolveDoc(dir, 'hello')).toEqual({ text: 'hello' });
  });

  it('reads external doc files', () => {
    setDescriptorDoc(profilePath, 'Home', '# Doc\n\nbody');
    const resolved = resolveDoc(dir, { href: `${DOC_DIR}/Home.md`, format: 'markdown' });
    expect(resolved).toEqual({
      text: '# Doc\n\nbody\n',
      href: `${DOC_DIR}/Home.md`,
      format: 'markdown',
    });
  });

  it('falls back to the inline value when the external file is missing', () => {
    const resolved = resolveDoc(dir, { href: `${DOC_DIR}/missing.md`, value: 'fallback' });
    expect(resolved?.text).toBe('fallback');
  });

  it('returns an empty string for object docs without value text', () => {
    expect(resolveDoc(dir, { format: 'text' })).toEqual({
      text: '',
      href: undefined,
      format: 'text',
    });
  });

  it('does not fetch http urls', () => {
    const resolved = resolveDoc(dir, { href: 'https://example.com/doc.md', value: 'inline' });
    expect(resolved).toEqual({ text: 'inline', href: 'https://example.com/doc.md', format: undefined });
  });

  it('does not read through symlinks escaping the profile directory', () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-store-outside-'));
    try {
      fs.writeFileSync(path.join(outside, 'secret.md'), 'secret');
      fs.symlinkSync(outside, path.join(dir, 'extdocs'));
      const resolved = resolveDoc(dir, { href: 'extdocs/secret.md', value: 'fallback' });
      expect(resolved?.text).toBe('fallback');
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it('does not read hrefs that escape the profile directory', () => {
    const outside = path.join(path.dirname(dir), 'outside-secret.md');
    fs.writeFileSync(outside, 'secret');
    try {
      for (const href of [`../${path.basename(outside)}`, outside, `file://${outside}`]) {
        const resolved = resolveDoc(dir, { href, value: 'fallback' });
        expect(resolved?.text).toBe('fallback');
      }
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  it('returns undefined for missing docs', () => {
    expect(resolveDoc(dir, undefined)).toBeUndefined();
  });

  it('returns undefined when the base directory cannot be resolved', () => {
    expect(resolveSafeLocalPath(path.join(dir, 'missing-base'), 'doc.md')).toBeUndefined();
  });
});

export {};
