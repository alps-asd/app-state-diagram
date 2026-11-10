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

const XML_OPTIONS = {
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  parseTagValue: false,
  // Keep entity and character references as written; inserted doc text is escaped by escapeXmlText().
  processEntities: false,
} as const;

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
  // deepest existing ancestor instead. lstat stops at a dangling symlink,
  // so realpath throws and the path is rejected.
  try {
    const baseReal = fs.realpathSync(baseDir);
    let existing = abs;
    for (;;) {
      try {
        fs.lstatSync(existing);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          return undefined;
        }
        existing = path.dirname(existing);
      }
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
 * when the href is unsafe, remote, or does not point to a readable file
 */
export function readExternalDoc(baseDir: string, href: string | undefined): string | undefined {
  if (!href) {
    return undefined;
  }
  const docPath = resolveSafeLocalPath(baseDir, href);
  if (!docPath) {
    return undefined;
  }
  try {
    if (!fs.statSync(docPath).isFile()) {
      return undefined;
    }
    return fs.readFileSync(docPath, 'utf-8');
  } catch {
    return undefined;
  }
}

/**
 * Return a self-contained copy of an ALPS profile (JSON or XML) in which
 * every doc that links a local file via href and has no inline value of
 * its own carries the file content as its value
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
    if (!doc || typeof doc !== 'object' || typeof doc.href !== 'string' || doc.value) {
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
  return { content: serializeJsonLike(root, content), inlined };
}

type XmlNode = Record<string, unknown>;

function inlineXmlDocs(content: string, baseDir: string): InlineDocsResult {
  let tree: XmlNode[];
  try {
    tree = new XMLParser(XML_OPTIONS).parse(content) as XmlNode[];
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
        const hasValue = elementChildren(child).some(c => {
          const childName = elementName(c);
          if (childName === '#comment') {
            return false;
          }
          return childName !== '#text' || String(c['#text']).trim() !== '';
        });
        if (href && !hasValue) {
          const text = readExternalDoc(baseDir, href);
          if (text !== undefined) {
            child.doc = [{ '#text': escapeXmlText(text) }];
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
  const xml = new XMLBuilder({ ...XML_OPTIONS, format: true }).build(tree);
  return { content: xml.replace(/^\n/, '').replace(/\n*$/, '\n'), inlined };
}

function elementName(node: XmlNode): string | undefined {
  return Object.keys(node).find(key => key !== ':@');
}

function escapeXmlText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
function serializeJsonLike(root: unknown, original: string): string {
  const indentMatch = original.match(/^([ \t]+)"/m);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const json = JSON.stringify(root, null, indent);
  return original.endsWith('\n') ? `${json}\n` : json;
}
