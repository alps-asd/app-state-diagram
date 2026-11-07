import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { inlineExternalDocs, readExternalDoc, resolveSafeLocalPath } from './doc-inliner';
import { parseAlpsAuto, docText } from '../parser/alps-parser';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inliner-'));
  fs.mkdirSync(path.join(dir, 'alps', 'docs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'alps', 'docs', 'Order.md'), '# Order\n\nCancel until shipment & <keep> markup.\n');
  fs.writeFileSync(path.join(dir, 'README.md'), 'Root overview\n');
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const json = (alps: unknown, indent = 2) => JSON.stringify({ alps }, null, indent) + '\n';

describe('inlineExternalDocs (JSON)', () => {
  it('inlines a linked doc file as the value, keeping href and format', () => {
    const content = json({
      doc: { href: 'README.md' },
      descriptor: [
        { id: 'Order', doc: { href: 'alps/docs/Order.md', format: 'markdown' }, descriptor: [
          { id: 'line', doc: { href: 'alps/docs/Order.md' } },
        ] },
      ],
    });
    const result = inlineExternalDocs(content, dir);
    expect(result.inlined).toEqual(['README.md', 'alps/docs/Order.md']);
    const parsed = JSON.parse(result.content);
    expect(parsed.alps.doc).toEqual({ href: 'README.md', value: 'Root overview\n' });
    expect(parsed.alps.descriptor[0].doc).toEqual({
      href: 'alps/docs/Order.md',
      format: 'markdown',
      value: '# Order\n\nCancel until shipment & <keep> markup.\n',
    });
    expect(parsed.alps.descriptor[0].descriptor[0].doc.value).toContain('Cancel until shipment');
  });

  it('keeps the original indentation and trailing newline', () => {
    const content = json({ descriptor: [{ id: 'Order', doc: { href: 'alps/docs/Order.md' } }] }, 4);
    const result = inlineExternalDocs(content, dir);
    expect(result.content).toContain('\n    "alps"');
    expect(result.content.endsWith('\n')).toBe(true);
  });

  it('returns the content unchanged when there is nothing to inline', () => {
    const content = json({ descriptor: [{ id: 'Order', doc: 'inline' }, { id: 'Plain' }, 'junk', null] });
    expect(inlineExternalDocs(content, dir)).toEqual({ content, inlined: [] });
  });

  it('never overrides an inline value', () => {
    const content = json({ descriptor: [{ id: 'Order', doc: { href: 'alps/docs/Order.md', value: 'Summary' } }] });
    expect(inlineExternalDocs(content, dir).inlined).toEqual([]);
  });

  it('skips missing, unsafe, remote, and directory hrefs', () => {
    const outside = path.join(path.dirname(dir), `outside-${path.basename(dir)}.md`);
    fs.writeFileSync(outside, 'secret');
    try {
      const hrefs = ['alps/docs/missing.md', `../${path.basename(outside)}`, outside, 'https://example.com/doc.md', 'alps/docs'];
      const content = json({ descriptor: hrefs.map((href, i) => ({ id: `d${i}`, doc: { href } })) });
      expect(inlineExternalDocs(content, dir)).toEqual({ content, inlined: [] });
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  it('returns invalid JSON and documents without alps unchanged', () => {
    expect(inlineExternalDocs('{ broken', dir)).toEqual({ content: '{ broken', inlined: [] });
    expect(inlineExternalDocs('{"other": 1}', dir)).toEqual({ content: '{"other": 1}', inlined: [] });
  });

  it('serializes without a trailing newline when the original had none', () => {
    const content = JSON.stringify({ alps: { descriptor: [{ id: 'Order', doc: { href: 'alps/docs/Order.md' } }] } });
    const result = inlineExternalDocs(content, dir);
    expect(result.content.endsWith('\n')).toBe(false);
    expect(result.inlined).toEqual(['alps/docs/Order.md']);
  });
});

describe('inlineExternalDocs (XML)', () => {
  const XML = `<?xml version="1.0"?>
<alps version="1.0">
  <!-- keep me -->
  <doc href="README.md"/>
  <descriptor id="Order">
    <doc href="alps/docs/Order.md" format="markdown"/>
    <descriptor id="line"><doc href="alps/docs/Order.md"/></descriptor>
    <descriptor href="#Home"/>
  </descriptor>
  <descriptor id="Home"><doc href="alps/docs/Order.md">Explicit summary</doc></descriptor>
  <descriptor id="Cdata"><doc href="alps/docs/Order.md"><![CDATA[Kept]]></doc></descriptor>
</alps>
`;

  it('inlines empty linked doc elements and parses back with the file content', () => {
    const result = inlineExternalDocs(XML, dir);
    expect(result.inlined).toEqual(['README.md', 'alps/docs/Order.md']);
    expect(result.content).toContain('<!-- keep me -->');
    const doc = parseAlpsAuto(result.content);
    expect(docText(doc.alps.doc)).toBe('Root overview');
    const order = doc.alps.descriptor?.[0];
    expect(order?.doc).toMatchObject({ href: 'alps/docs/Order.md', format: 'markdown' });
    expect(docText(order?.doc)).toContain('Cancel until shipment & <keep> markup.');
    expect(docText(order?.descriptor?.[0].doc)).toContain('Cancel until shipment');
  });

  it('keeps explicit text and CDATA values', () => {
    const doc = parseAlpsAuto(inlineExternalDocs(XML, dir).content);
    expect(docText(doc.alps.descriptor?.[1].doc)).toBe('Explicit summary');
    expect(docText(doc.alps.descriptor?.[2].doc)).toBe('Kept');
  });

  it('returns the content unchanged when there is nothing to inline', () => {
    const content = '<alps><descriptor id="Order"><doc>inline</doc></descriptor></alps>';
    expect(inlineExternalDocs(content, dir)).toEqual({ content, inlined: [] });
  });

  it('skips linked doc files that do not exist', () => {
    const content = '<alps><descriptor id="Order"><doc href="alps/docs/missing.md"/></descriptor></alps>';
    expect(inlineExternalDocs(content, dir)).toEqual({ content, inlined: [] });
  });

  it('returns malformed XML and documents without alps unchanged', () => {
    expect(inlineExternalDocs('<alps', dir)).toEqual({ content: '<alps', inlined: [] });
    expect(inlineExternalDocs('<alps><descriptor></alps>', dir).inlined).toEqual([]);
    expect(inlineExternalDocs('<other/>', dir)).toEqual({ content: '<other/>', inlined: [] });
  });
});

describe('readExternalDoc', () => {
  it('reads safe local files only', () => {
    expect(readExternalDoc(dir, 'README.md')).toBe('Root overview\n');
    expect(readExternalDoc(dir, undefined)).toBeUndefined();
    expect(readExternalDoc(dir, 'alps/docs')).toBeUndefined();
    expect(readExternalDoc(dir, 'missing.md')).toBeUndefined();
    expect(readExternalDoc(dir, 'file:///etc/hosts')).toBeUndefined();
  });
});

describe('resolveSafeLocalPath', () => {
  it('rejects schemes, absolute paths, backslashes, and traversal', () => {
    for (const href of ['http://x/a.md', 'C:/a.md', '//host/a.md', '/etc/a.md', 'a\\b.md', '../a.md']) {
      expect(resolveSafeLocalPath(dir, href)).toBeUndefined();
    }
  });

  it('allows symlinks that stay inside the base directory and rejects escaping ones', () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inliner-outside-'));
    try {
      fs.symlinkSync(path.join(dir, 'alps'), path.join(dir, 'compat'));
      fs.symlinkSync(outside, path.join(dir, 'escape'));
      expect(resolveSafeLocalPath(dir, 'compat/docs/Order.md')).toBe(path.join(dir, 'compat/docs/Order.md'));
      expect(resolveSafeLocalPath(dir, 'escape/new.md')).toBeUndefined();
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it('accepts not-yet-existing files inside the base directory', () => {
    expect(resolveSafeLocalPath(dir, 'alps/docs/New.md')).toBe(path.join(dir, 'alps/docs/New.md'));
  });

  it('rejects everything when the base directory does not exist', () => {
    expect(resolveSafeLocalPath(path.join(dir, 'no-such-dir'), 'a.md')).toBeUndefined();
  });
});
