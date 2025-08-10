import { XMLParser } from 'fast-xml-parser';
import { AlpsDocument, ValidationResult } from '../types/alps';

export class AlpsParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: 'value',
      allowBooleanAttributes: true
    });
  }

  parse(content: string, format?: 'json' | 'xml'): AlpsDocument {
    const detectedFormat = format || this.detectFormat(content);
    
    if (detectedFormat === 'json') {
      return this.parseJson(content);
    } else if (detectedFormat === 'xml') {
      return this.parseXml(content);
    } else {
      throw new Error('Unsupported format. Only JSON and XML are supported.');
    }
  }

  private detectFormat(content: string): 'json' | 'xml' {
    const trimmed = content.trim();
    
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }
    
    if (trimmed.startsWith('<')) {
      return 'xml';
    }
    
    throw new Error('Cannot detect format. Content must be valid JSON or XML.');
  }

  private parseJson(content: string): AlpsDocument {
    try {
      const parsed = JSON.parse(content);
      
      if (!parsed.alps) {
        throw new Error('Invalid ALPS document: missing alps property');
      }
      
      return this.normalizeDocument(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw error;
    }
  }

  private parseXml(content: string): AlpsDocument {
    try {
      const parsed = this.xmlParser.parse(content);
      
      if (!parsed.alps) {
        throw new Error('Invalid ALPS document: missing alps element');
      }
      
      return this.normalizeDocument(parsed);
    } catch (error) {
      throw new Error(`Invalid XML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private normalizeDocument(parsed: any): AlpsDocument {
    const alps = parsed.alps;
    
    // Ensure descriptor is always an array
    if (alps.descriptor && !Array.isArray(alps.descriptor)) {
      alps.descriptor = [alps.descriptor];
    } else if (!alps.descriptor) {
      alps.descriptor = [];
    }

    // Normalize documentation
    if (typeof alps.doc === 'string') {
      alps.doc = { value: alps.doc };
    }

    // Recursively normalize descriptors with type checks
    alps.descriptor = alps.descriptor
      .filter((desc: any) => typeof desc === 'object' && desc !== null)
      .map((desc: any) => this.normalizeDescriptor(desc));

    return { alps };
  }

  private normalizeDescriptor(descriptor: any): any {
    const normalized = { ...descriptor };

    // Normalize documentation
    if (typeof normalized.doc === 'string') {
      normalized.doc = { value: normalized.doc };
    }

    // Ensure nested descriptors are arrays
    if (normalized.descriptor && !Array.isArray(normalized.descriptor)) {
      normalized.descriptor = [normalized.descriptor];
    } else if (normalized.descriptor) {
      normalized.descriptor = normalized.descriptor.map((desc: any) => this.normalizeDescriptor(desc));
    }

    return normalized;
  }

  validate(document: AlpsDocument): ValidationResult {
    const errors: string[] = [];

    if (!document.alps) {
      errors.push('Missing alps property');
      return { isValid: false, errors };
    }

    if (!document.alps.descriptor || !Array.isArray(document.alps.descriptor)) {
      errors.push('ALPS document must have descriptor array');
      return { isValid: false, errors };
    }

    // Validate descriptors
    this.validateDescriptors(document.alps.descriptor, errors, new Set());

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateDescriptors(descriptors: any[], errors: string[], ids: Set<string>, path = ''): void {
    for (let i = 0; i < descriptors.length; i++) {
      const desc = descriptors[i];
      const currentPath = path ? `${path}[${i}]` : `descriptor[${i}]`;

      // Check for id or href
      if (!desc.id && !desc.href) {
        errors.push(`${currentPath}: descriptor must have either id or href`);
        continue;
      }

      // Check for duplicate IDs
      if (desc.id) {
        if (ids.has(desc.id)) {
          errors.push(`${currentPath}: duplicate id '${desc.id}'`);
        } else {
          ids.add(desc.id);
        }
      }

      // Validate type
      if (desc.type && !['semantic', 'safe', 'unsafe', 'idempotent'].includes(desc.type)) {
        errors.push(`${currentPath}: invalid type '${desc.type}'. Must be semantic, safe, unsafe, or idempotent`);
      }

      // Validate href format
      if (desc.href && typeof desc.href === 'string') {
        if (desc.href.startsWith('#') && desc.href.length === 1) {
          errors.push(`${currentPath}: href cannot be just '#'`);
        }
      }

      // Recursively validate nested descriptors
      if (desc.descriptor && Array.isArray(desc.descriptor)) {
        this.validateDescriptors(desc.descriptor, errors, ids, `${currentPath}.descriptor`);
      }
    }
  }
}