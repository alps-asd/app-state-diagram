/**
 * Node.js ALPS Parser
 *
 * Parses ALPS documents (JSON/XML) using fast-xml-parser for XML.
 * This is the Node.js adapter for the browser-based parser in public/js/diagramAdapters.js
 */

import { XMLParser } from 'fast-xml-parser';

export interface AlpsDoc {
  value?: string;
  href?: string;
  format?: string;
  contentType?: string;
}

export interface AlpsDescriptor {
  id?: string;
  type?: 'semantic' | 'safe' | 'unsafe' | 'idempotent';
  title?: string;
  def?: string;
  doc?: string | AlpsDoc;
  rel?: string;
  rt?: string;
  tag?: string;
  href?: string;
  descriptor?: AlpsDescriptor[];
}

export interface AlpsLink {
  rel: string;
  href: string;
  title?: string;
}

export interface AlpsDocument {
  alps: {
    title?: string;
    doc?: string | AlpsDoc;
    descriptor?: AlpsDescriptor[];
    link?: AlpsLink | AlpsLink[];
  };
}

/**
 * Parse ALPS content (JSON or XML)
 */
export function parseAlps(content: string, fileType: 'JSON' | 'XML'): AlpsDocument {
  if (fileType === 'JSON') {
    return parseAlpsJson(content);
  }
  return parseAlpsXml(content);
}

/**
 * Auto-detect format and parse ALPS content
 */
export function parseAlpsAuto(content: string): AlpsDocument {
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    return parseAlpsJson(content);
  }
  return parseAlpsXml(content);
}

/**
 * Parse ALPS JSON
 */
function parseAlpsJson(content: string): AlpsDocument {
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON format: ${(e as Error).message}`);
  }
}

/**
 * Parse ALPS XML using fast-xml-parser
 */
function parseAlpsXml(content: string): AlpsDocument {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      isArray: (name) => name === 'descriptor' || name === 'link',
    });

    const parsed = parser.parse(content);
    return xmlToAlpsObject(parsed);
  } catch (e) {
    throw new Error(`Invalid XML format: ${(e as Error).message}`);
  }
}

/**
 * Convert parsed XML to ALPS document structure
 */
function xmlToAlpsObject(parsed: any): AlpsDocument {
  const alps = parsed.alps;
  if (!alps) {
    throw new Error('No alps element found in XML');
  }

  const descriptors: AlpsDescriptor[] = [];
  const rawDescriptors = alps.descriptor || [];

  for (const desc of rawDescriptors) {
    descriptors.push(convertDescriptor(desc));
  }

  // Extract links
  const links: AlpsLink[] = [];
  const rawLinks = alps.link || [];
  for (const link of rawLinks) {
    links.push({
      rel: link['@_rel'] || '',
      href: link['@_href'] || '',
      title: link['@_title'] || '',
    });
  }

  const result: AlpsDocument = {
    alps: {
      title: alps.title?.['#text'] || alps.title || 'ALPS Profile',
      descriptor: descriptors,
    },
  };

  const rootDoc = convertDoc(alps.doc);
  if (rootDoc !== undefined) {
    result.alps.doc = rootDoc;
  }

  if (links.length > 0) {
    result.alps.link = links;
  }

  return result;
}

/**
 * Convert XML doc element to string or AlpsDoc.
 * Supports <doc>text</doc> and <doc href="..." format="..."/> forms.
 */
function convertDoc(doc: any): string | AlpsDoc | undefined {
  if (doc === undefined || doc === null) {
    return undefined;
  }
  if (typeof doc === 'string') {
    return doc;
  }
  const result: AlpsDoc = {};
  if (doc['#text'] !== undefined) {
    result.value = String(doc['#text']);
  }
  if (doc['@_href']) {
    result.href = doc['@_href'];
  }
  if (doc['@_format']) {
    result.format = doc['@_format'];
  }
  if (doc['@_contentType']) {
    result.contentType = doc['@_contentType'];
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Get the inline text of a doc (string or AlpsDoc form)
 */
export function docText(doc: string | AlpsDoc | undefined): string {
  if (doc === undefined) {
    return '';
  }
  if (typeof doc === 'string') {
    return doc;
  }
  return doc.value || '';
}

/**
 * Extract a local fragment id from an href/rt reference.
 * Returns null for external references ("file.json#id", "http://...").
 */
export function localFragment(ref: string | undefined): string | null {
  if (!ref || !ref.startsWith('#')) {
    return null;
  }
  return ref.substring(1);
}

/**
 * Visit every descriptor in a tree, depth-first
 */
export function walkDescriptors(
  descriptors: AlpsDescriptor[],
  visit: (desc: AlpsDescriptor) => void
): void {
  for (const desc of descriptors) {
    visit(desc);
    if (Array.isArray(desc.descriptor)) {
      walkDescriptors(desc.descriptor, visit);
    }
  }
}

/**
 * Find a descriptor by id, searching nested descriptors.
 * Accepts unknown input so it can be used on raw (unnormalized) JSON.
 */
export function findDescriptorById(descriptors: unknown, id: string): AlpsDescriptor | null {
  if (!Array.isArray(descriptors)) {
    return null;
  }
  for (const desc of descriptors) {
    if (desc && typeof desc === 'object') {
      if ((desc as AlpsDescriptor).id === id) {
        return desc as AlpsDescriptor;
      }
      const found = findDescriptorById((desc as AlpsDescriptor).descriptor, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Convert XML descriptor to AlpsDescriptor
 */
function convertDescriptor(desc: any): AlpsDescriptor {
  const descriptor: AlpsDescriptor = {
    id: desc['@_id'],
    type: desc['@_type'],
    title: desc['@_title'] || desc['@_id'],
    rt: desc['@_rt'],
    tag: desc['@_tag'],
    def: desc['@_def'],
    rel: desc['@_rel'],
    href: desc['@_href'],
  };

  // Extract doc element
  const doc = convertDoc(desc.doc);
  if (doc !== undefined) {
    descriptor.doc = doc;
  }

  // Extract nested descriptors
  if (desc.descriptor && Array.isArray(desc.descriptor)) {
    descriptor.descriptor = desc.descriptor.map((nested: any) => ({
      href: nested['@_href'],
      id: nested['@_id'],
      type: nested['@_type'],
    }));
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(descriptor).filter(([_, v]) => v !== undefined)
  ) as AlpsDescriptor;
}
