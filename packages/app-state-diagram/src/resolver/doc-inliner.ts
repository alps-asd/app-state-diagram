/**
 * Doc inliner - make externalized descriptor docs visible to every reader
 *
 * Long docs are kept in local files (e.g. alps/docs/<id>.md) and linked
 * with doc.href. Readers that only see the profile text - the generated
 * HTML, the browser editor, a shared editor URL - would show those docs as
 * empty. inlineExternalDocs() returns a self-contained copy of the profile
 * in which each such doc also carries the file content as its value. The
 * href and format stay, so the copy still records where the doc lives.
 *
 * Only derived copies are produced; the profile file is never rewritten.
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export interface InlineDocsResult {
  /** Profile content with external docs inlined (unchanged when nothing was inlined) */
  content: string;
  /** doc.href values whose file content was inlined, in document order, without duplicates */
  inlined: string[];
}

/**
 * fast-xml-parser options for reading a profile and writing it back.
 * parseTagValue is off so text that looks like a number ("007", "1.0")
 * survives the round trip unchanged. Shared with the MCP XML store.
 */
export const XML_ROUNDTRIP_OPTIONS = {
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  parseTagValue: false,
} as const;

/** File types that may be read as a doc (anything else is not documentation) */
const DOC_EXTENSIONS = new Set(['.md', '.markdown', '.txt', '.html', '.htm', '.adoc', '.rst']);

/** Largest doc file that is read; larger files are treated as not being a doc */
export const MAX_EXTERNAL_DOC_BYTES = 256 * 1024;

/**
 * Resolve a local href (doc.href, describedby link) against the profile
 * directory, rejecting anything that escapes it: URL schemes ("http:",
 * "file:", Windows drives), protocol-relative or absolute paths,
 * backslashes, and ../ traversal. Symlinks inside the profile directory
 * are legitimate (e.g. compat links keeping old layouts working), but
 * their real targets must stay inside it. Returns the absolute path, or
 * undefined when unsafe.
 */
export function resolveSafeLocalPath(baseDir: string, href: string): string | undefined {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
    return undefined;
  }
  if (href.startsWith('//') || href.includes('\\') || path.isAbsolute(href)) {
    return undefined;
  }
  const abs = path.resolve(baseDir, href);
  const rel = path.relative(baseDir, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return undefined;
  }
  // Compare real paths so a symlinked component cannot escape baseDir.
  // The target file may not exist yet (first write), so check the
  // deepest existing ancestor instead.
  try {
    const baseReal = fs.realpathSync(baseDir);
    let existing = abs;
    while (!fs.existsSync(existing)) {
      existing = path.dirname(existing);
    }
    const existingReal = fs.realpathSync(existing);
    if (existingReal !== baseReal && !existingReal.startsWith(baseReal + path.sep)) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return abs;
}

/**
 * Read the content of a local doc file linked by doc.href, or undefined
 * when the href is unsafe, remote, or does not point to a readable file.
 *
 * The content ends up in generated HTML and shared editor URLs, so only
 * documentation is read: a text/markup extension, no hidden path segment
 * (".env", ".git/..."), and at most MAX_EXTERNAL_DOC_BYTES. A profile
 * cannot use doc.href to pull in other files that sit next to it.
 */
export function readExternalDoc(baseDir: string, href: string | undefined): string | undefined {
  if (!href || !isDocFileName(href)) {
    return undefined;
  }
  const docPath = resolveSafeLocalPath(baseDir, href);
  if (!docPath) {
    return undefined;
  }
  try {
    const stat = fs.statSync(docPath);
    if (!stat.isFile() || stat.size > MAX_EXTERNAL_DOC_BYTES) {
      return undefined;
    }
    return fs.readFileSync(docPath, 'utf-8');
  } catch {
    return undefined;
  }
}

function isDocFileName(href: string): boolean {
  if (href.split('/').some(segment => segment.startsWith('.') && segment !== '.')) {
    return false;
  }
  return DOC_EXTENSIONS.has(path.extname(href).toLowerCase());
}

/**
 * Return a self-contained copy of an ALPS profile (JSON or XML) in which
 * every doc that links a local file via href carries the file content as
 * its value. The linked file wins over an inline value, the same order
 * the MCP server uses when it resolves a doc (alps_descriptor).
 */
export function inlineExternalDocs(content: string, baseDir: string): InlineDocsResult {
  if (content.trim().startsWith('{')) {
    return inlineJsonDocs(content, baseDir);
  }
  return inlineXmlDocs(content, baseDir);
}

function inlineJsonDocs(content: string, baseDir: string): InlineDocsResult {
  let root: { alps?: { doc?: unknown; descriptor?: unknown } };
  try {
    root = JSON.parse(content);
  } catch {
    return { content, inlined: [] };
  }
  const inlined: string[] = [];
  const inlineDoc = (owner: { doc?: unknown }): void => {
    const doc = owner.doc as { href?: unknown; value?: unknown } | undefined;
    if (!doc || typeof doc !== 'object' || typeof doc.href !== 'string') {
      return;
    }
    const text = readExternalDoc(baseDir, doc.href);
    if (text !== undefined) {
      doc.value = text;
      addUnique(inlined, doc.href);
    }
  };
  const walk = (descriptors: unknown): void => {
    if (!Array.isArray(descriptors)) {
      return;
    }
    for (const desc of descriptors) {
      if (desc && typeof desc === 'object') {
        inlineDoc(desc as { doc?: unknown });
        walk((desc as { descriptor?: unknown }).descriptor);
      }
    }
  };
  if (root?.alps && typeof root.alps === 'object') {
    inlineDoc(root.alps);
    walk(root.alps.descriptor);
  }
  if (inlined.length === 0) {
    return { content, inlined };
  }
  return { content: serializeLike(root, content), inlined };
}

type XmlNode = Record<string, unknown>;

function inlineXmlDocs(content: string, baseDir: string): InlineDocsResult {
  let tree: XmlNode[];
  try {
    tree = new XMLParser(XML_ROUNDTRIP_OPTIONS).parse(content) as XmlNode[];
  } catch {
    return { content, inlined: [] };
  }
  const alps = tree.find(node => elementName(node) === 'alps');
  if (!alps) {
    return { content, inlined: [] };
  }
  const inlined: string[] = [];
  const walk = (node: XmlNode): void => {
    for (const child of elementChildren(node)) {
      const name = elementName(child);
      if (name === 'doc') {
        const attrs = child[':@'] as Record<string, string> | undefined;
        const href = attrs?.['@_href'];
        if (href) {
          const text = readExternalDoc(baseDir, href);
          if (text !== undefined) {
            child.doc = [{ '#text': text }];
            addUnique(inlined, href);
          }
        }
      } else if (name === 'descriptor') {
        walk(child);
      }
    }
  };
  walk(alps);
  if (inlined.length === 0) {
    return { content, inlined };
  }
  const xml = new XMLBuilder({ ...XML_ROUNDTRIP_OPTIONS, format: true }).build(tree);
  return { content: xml.replace(/^\n/, '').replace(/\n*$/, '\n'), inlined };
}

function elementName(node: XmlNode): string | undefined {
  return Object.keys(node).find(key => key !== ':@');
}

/** Child nodes of an element (in preserve-order trees an element's value is always an array) */
function elementChildren(node: XmlNode): XmlNode[] {
  return node[elementName(node) as string] as XmlNode[];
}

function addUnique(list: string[], value: string): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

/**
 * Serialize JSON keeping the original file's indentation and trailing newline
 */
export function serializeLike(root: unknown, original: string): string {
  const indentMatch = original.match(/^([ \t]+)"/m);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const json = JSON.stringify(root, null, indent);
  return original.endsWith('\n') ? `${json}\n` : json;
}
