/**
 * Node.js ALPS Parser
 *
 * Parses ALPS documents (JSON/XML) using fast-xml-parser for XML.
 * This is the Node.js adapter for the browser-based parser in public/js/diagramAdapters.js
 */

import { XMLParser } from 'fast-xml-parser';

export interface AlpsDescriptor {
  id?: string;
  type?: 'semantic' | 'safe' | 'unsafe' | 'idempotent';
  title?: string;
  def?: string;
  doc?: string | { value: string };
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
    doc?: string | { value: string };
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
      doc: alps.doc?.['#text'] || alps.doc || '',
      descriptor: descriptors,
    },
  };

  if (links.length > 0) {
    result.alps.link = links;
  }

  return result;
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
  if (desc.doc) {
    descriptor.doc = desc.doc['#text'] || desc.doc;
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
