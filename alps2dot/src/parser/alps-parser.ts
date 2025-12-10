import { XMLParser } from 'fast-xml-parser';
import {
  AlpsDocument,
  ValidationResult,
  ValidationIssue,
  ErrorCodes,
  WarningCodes,
  SuggestionCodes
} from '../types/alps';

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
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const suggestions: ValidationIssue[] = [];

    if (!document.alps) {
      errors.push({
        code: ErrorCodes.MISSING_ALPS,
        message: 'Missing alps property',
        path: ''
      });
      return this.buildResult(errors, warnings, suggestions);
    }

    if (!document.alps.descriptor || !Array.isArray(document.alps.descriptor)) {
      errors.push({
        code: ErrorCodes.MISSING_DESCRIPTOR_ARRAY,
        message: 'ALPS document must have descriptor array',
        path: 'alps'
      });
      return this.buildResult(errors, warnings, suggestions);
    }

    // Collect all defined IDs and referenced IDs
    const definedIds = new Set<string>();
    const referencedIds = new Map<string, string>(); // refId -> path
    const transitionIds = new Set<string>();
    const stateIds = new Set<string>();

    // First pass: collect all IDs
    this.collectIds(document.alps.descriptor, definedIds, referencedIds, transitionIds, stateIds);

    // Second pass: validate descriptors
    this.validateDescriptors(document.alps.descriptor, errors, warnings, suggestions, new Set(), definedIds);

    // Check for broken references
    for (const [refId, path] of referencedIds) {
      if (!definedIds.has(refId)) {
        errors.push({
          code: ErrorCodes.BROKEN_REFERENCE,
          message: `Referenced descriptor '#${refId}' does not exist`,
          path
        });
      }
    }

    // Check for orphan descriptors (defined but never referenced)
    const referencedIdSet = new Set(referencedIds.keys());
    for (const id of definedIds) {
      if (!referencedIdSet.has(id) && !stateIds.has(id)) {
        const isTopLevel = document.alps.descriptor.some(d => d.id === id);
        if (!isTopLevel) {
          warnings.push({
            code: WarningCodes.ORPHAN_DESCRIPTOR,
            message: `Descriptor '${id}' is defined but never referenced`,
            descriptorId: id
          });
        }
      }
    }

    // Document-level suggestions
    if (!document.alps.title) {
      suggestions.push({
        code: SuggestionCodes.MISSING_ALPS_TITLE,
        message: 'Consider adding a title to the ALPS document',
        path: 'alps'
      });
    }
    if (!document.alps.doc) {
      suggestions.push({
        code: SuggestionCodes.MISSING_ALPS_DOC,
        message: 'Consider adding documentation (doc) to describe the API',
        path: 'alps'
      });
    }

    return this.buildResult(errors, warnings, suggestions);
  }

  private buildResult(
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    suggestions: ValidationIssue[]
  ): ValidationResult {
    return {
      isValid: errors.length === 0,
      summary: {
        errorCount: errors.length,
        warningCount: warnings.length,
        suggestionCount: suggestions.length
      },
      errors,
      warnings,
      suggestions
    };
  }

  private collectIds(
    descriptors: any[],
    definedIds: Set<string>,
    referencedIds: Map<string, string>,
    transitionIds: Set<string>,
    stateIds: Set<string>,
    path = ''
  ): void {
    for (let i = 0; i < descriptors.length; i++) {
      const desc = descriptors[i];
      const currentPath = path ? `${path}[${i}]` : `descriptor[${i}]`;

      // Collect defined ID
      if (desc.id) {
        definedIds.add(desc.id);

        // Categorize by type
        if (desc.type && ['safe', 'unsafe', 'idempotent'].includes(desc.type)) {
          transitionIds.add(desc.id);
        } else if (desc.descriptor && desc.descriptor.length > 0) {
          // Semantic with nested descriptors = state
          stateIds.add(desc.id);
        }
      }

      // Collect referenced ID from href
      if (desc.href && typeof desc.href === 'string' && desc.href.startsWith('#')) {
        const refId = desc.href.substring(1);
        if (refId) {
          referencedIds.set(refId, currentPath);
        }
      }

      // Collect referenced ID from rt
      if (desc.rt && typeof desc.rt === 'string' && desc.rt.startsWith('#')) {
        const refId = desc.rt.substring(1);
        if (refId) {
          referencedIds.set(refId, currentPath);
        }
      }

      // Recurse into nested descriptors
      if (desc.descriptor && Array.isArray(desc.descriptor)) {
        this.collectIds(desc.descriptor, definedIds, referencedIds, transitionIds, stateIds, `${currentPath}.descriptor`);
      }
    }
  }

  private validateDescriptors(
    descriptors: any[],
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    suggestions: ValidationIssue[],
    ids: Set<string>,
    allDefinedIds: Set<string>,
    path = ''
  ): void {
    for (let i = 0; i < descriptors.length; i++) {
      const desc = descriptors[i];
      const currentPath = path ? `${path}[${i}]` : `descriptor[${i}]`;

      // Check for id or href
      if (!desc.id && !desc.href) {
        errors.push({
          code: ErrorCodes.MISSING_ID_OR_HREF,
          message: 'Descriptor must have either id or href',
          path: currentPath
        });
        continue;
      }

      // Check for duplicate IDs
      if (desc.id) {
        if (ids.has(desc.id)) {
          errors.push({
            code: ErrorCodes.DUPLICATE_ID,
            message: `Duplicate id '${desc.id}'`,
            path: currentPath,
            descriptorId: desc.id
          });
        } else {
          ids.add(desc.id);
        }
      }

      // Validate type
      if (desc.type && !['semantic', 'safe', 'unsafe', 'idempotent'].includes(desc.type)) {
        errors.push({
          code: ErrorCodes.INVALID_TYPE,
          message: `Invalid type '${desc.type}'. Must be semantic, safe, unsafe, or idempotent`,
          path: currentPath,
          descriptorId: desc.id
        });
      }

      // Validate href format
      if (desc.href && typeof desc.href === 'string') {
        if (desc.href.startsWith('#') && desc.href.length === 1) {
          errors.push({
            code: ErrorCodes.INVALID_HREF,
            message: "href cannot be just '#'",
            path: currentPath
          });
        }
      }

      // Transition-specific validation
      const isTransition = desc.type && ['safe', 'unsafe', 'idempotent'].includes(desc.type);
      if (isTransition) {
        // Must have rt
        if (!desc.rt) {
          errors.push({
            code: ErrorCodes.MISSING_RT,
            message: "Transition descriptor must have 'rt' (return type)",
            path: currentPath,
            descriptorId: desc.id
          });
        } else if (typeof desc.rt === 'string') {
          // rt must start with #
          if (!desc.rt.startsWith('#')) {
            errors.push({
              code: ErrorCodes.INVALID_RT_FORMAT,
              message: "'rt' must be a local reference starting with '#'",
              path: currentPath,
              descriptorId: desc.id
            });
          }
        }

        // Naming convention check
        if (desc.id) {
          if (desc.type === 'safe' && !desc.id.startsWith('go')) {
            warnings.push({
              code: WarningCodes.NAMING_CONVENTION_SAFE,
              message: "Safe transitions should start with 'go' (e.g., goHome, goProductList)",
              path: currentPath,
              descriptorId: desc.id
            });
          }
          if ((desc.type === 'unsafe' || desc.type === 'idempotent') && !desc.id.startsWith('do')) {
            warnings.push({
              code: WarningCodes.NAMING_CONVENTION_UNSAFE,
              message: "Unsafe/idempotent transitions should start with 'do' (e.g., doCreate, doUpdate)",
              path: currentPath,
              descriptorId: desc.id
            });
          }
        }

        // Should have doc for transitions
        if (!desc.doc) {
          suggestions.push({
            code: SuggestionCodes.MISSING_DOC,
            message: "Consider adding 'doc' to describe what this transition does",
            path: currentPath,
            descriptorId: desc.id
          });
        }
      }

      // Check for missing title
      if (desc.id && !desc.title) {
        warnings.push({
          code: WarningCodes.MISSING_TITLE,
          message: "Missing 'title' attribute",
          path: currentPath,
          descriptorId: desc.id
        });
      }

      // Check for invalid XML characters in title
      if (desc.title && this.containsInvalidXmlChars(desc.title)) {
        const invalidChars = this.getInvalidXmlChars(desc.title);
        errors.push({
          code: ErrorCodes.INVALID_XML_CHAR,
          message: `Title contains invalid XML characters: ${invalidChars.join(', ')}. These will cause SVG generation errors.`,
          path: currentPath,
          descriptorId: desc.id
        });
      }

      // Recursively validate nested descriptors
      if (desc.descriptor && Array.isArray(desc.descriptor)) {
        this.validateDescriptors(desc.descriptor, errors, warnings, suggestions, ids, allDefinedIds, `${currentPath}.descriptor`);
      }
    }
  }

  // XML special characters that need escaping in DOT/SVG labels
  private static readonly INVALID_XML_CHARS_PATTERN = '[&<>"\']';

  private containsInvalidXmlChars(text: string): boolean {
    return new RegExp(AlpsParser.INVALID_XML_CHARS_PATTERN).test(text);
  }

  private getInvalidXmlChars(text: string): string[] {
    const matches = text.match(new RegExp(AlpsParser.INVALID_XML_CHARS_PATTERN, 'g'));
    if (!matches) return [];

    const charNames: Record<string, string> = {
      '&': '& (ampersand)',
      '<': '< (less than)',
      '>': '> (greater than)',
      '"': '" (double quote)',
      "'": "' (single quote)"
    };

    return [...new Set(matches)].map(c => charNames[c] || c);
  }
}