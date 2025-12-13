import * as fs from 'fs';
import * as path from 'path';
import { parseAlpsAuto, AlpsDocument, AlpsDescriptor } from '../parser/alps-parser';

/**
 * Resolves external file references in ALPS documents
 * Handles both local file paths and HTTP URLs
 */
export class FileResolver {
  private cache: Map<string, AlpsDocument>;
  private basePath: string;

  constructor(basePath: string) {
    this.cache = new Map();
    this.basePath = basePath;
  }

  /**
   * Resolve all external references in an ALPS document
   */
  async resolve(document: AlpsDocument): Promise<AlpsDocument> {
    const resolvedDescriptors = await this.resolveDescriptors(document.alps.descriptor || []);

    return {
      alps: {
        ...document.alps,
        descriptor: resolvedDescriptors,
      },
    };
  }

  private async resolveDescriptors(descriptors: AlpsDescriptor[]): Promise<AlpsDescriptor[]> {
    const resolved: AlpsDescriptor[] = [];

    for (const desc of descriptors) {
      const resolvedDesc = await this.resolveDescriptor(desc);
      resolved.push(resolvedDesc);
    }

    return resolved;
  }

  private async resolveDescriptor(descriptor: AlpsDescriptor): Promise<AlpsDescriptor> {
    const resolved = { ...descriptor };

    // Resolve external href
    if (descriptor.href && !descriptor.href.startsWith('#')) {
      const external = await this.resolveExternalReference(descriptor.href);
      if (external) {
        // Merge external descriptor properties
        Object.assign(resolved, external, { href: descriptor.href });
      }
    }

    // Recursively resolve nested descriptors
    if (descriptor.descriptor) {
      resolved.descriptor = await this.resolveDescriptors(descriptor.descriptor);
    }

    return resolved;
  }

  private async resolveExternalReference(href: string): Promise<AlpsDescriptor | null> {
    const [filePath, fragment] = this.parseHref(href);

    if (!filePath) {
      return null;
    }

    try {
      const externalDoc = await this.loadDocument(filePath);

      if (fragment) {
        return this.findDescriptorById(externalDoc.alps.descriptor || [], fragment);
      }

      return null;
    } catch (error) {
      console.warn(`Failed to resolve external reference: ${href}`, error);
      return null;
    }
  }

  private parseHref(href: string): [string | null, string | null] {
    const hashIndex = href.indexOf('#');

    if (hashIndex === -1) {
      return [href, null];
    }

    if (hashIndex === 0) {
      return [null, href.substring(1)];
    }

    return [href.substring(0, hashIndex), href.substring(hashIndex + 1)];
  }

  private async loadDocument(filePath: string): Promise<AlpsDocument> {
    // Check cache first
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    let content: string;

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      content = await this.fetchUrl(filePath);
    } else {
      content = this.readLocalFile(filePath);
    }

    const document = parseAlpsAuto(content);
    this.cache.set(filePath, document);

    return document;
  }

  private readLocalFile(filePath: string): string {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.basePath, filePath);

    return fs.readFileSync(absolutePath, 'utf-8');
  }

  private async fetchUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }

  private findDescriptorById(descriptors: AlpsDescriptor[], id: string): AlpsDescriptor | null {
    for (const desc of descriptors) {
      if (desc.id === id) {
        return desc;
      }

      if (desc.descriptor) {
        const found = this.findDescriptorById(desc.descriptor, id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }
}
