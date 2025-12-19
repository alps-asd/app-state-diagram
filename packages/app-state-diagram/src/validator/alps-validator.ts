import { ValidationResult, ValidationIssue } from './types';

const VALID_TYPES = ['semantic', 'safe', 'unsafe', 'idempotent'];

export class AlpsValidator {
  validate(document: any): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const suggestions: ValidationIssue[] = [];

    // E008 - Missing alps property
    if (!document.alps) {
      errors.push({
        code: 'E008',
        severity: 'error',
        message: 'Missing alps property'
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    const alps = document.alps;

    // E009 - Missing descriptor array
    if (!alps.descriptor || !Array.isArray(alps.descriptor)) {
      errors.push({
        code: 'E009',
        severity: 'error',
        message: 'Missing descriptor array'
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    // W001 - Missing title
    if (!alps.title) {
      warnings.push({
        code: 'W001',
        severity: 'warning',
        message: 'Missing title attribute in ALPS document'
      });
    }

    // Collect all ids for reference checking
    const allIds = this.collectIds(alps.descriptor);
    const referencedIds = new Set<string>();

    // Validate each descriptor
    this.validateDescriptors(alps.descriptor, allIds, referencedIds, errors, warnings, suggestions);

    // W004 - Orphan descriptor (defined but never referenced)
    // Skip for now as it requires tracking usage

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private collectIds(descriptors: any[], ids: Set<string> = new Set()): Set<string> {
    for (const desc of descriptors) {
      if (desc.id) {
        ids.add(desc.id);
      }
      if (desc.descriptor && Array.isArray(desc.descriptor)) {
        this.collectIds(desc.descriptor, ids);
      }
    }
    return ids;
  }

  private validateDescriptors(
    descriptors: any[],
    allIds: Set<string>,
    referencedIds: Set<string>,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    suggestions: ValidationIssue[],
    path: string = 'alps.descriptor'
  ): void {
    const seenIds = new Set<string>();

    for (let i = 0; i < descriptors.length; i++) {
      const desc = descriptors[i];
      const descPath = `${path}[${i}]`;

      // E001 - Missing id or href
      if (!desc.id && !desc.href) {
        errors.push({
          code: 'E001',
          severity: 'error',
          message: 'Descriptor must have either id or href',
          path: descPath
        });
      }

      // E005 - Duplicate id
      if (desc.id) {
        if (seenIds.has(desc.id)) {
          errors.push({
            code: 'E005',
            severity: 'error',
            message: `Duplicate id: ${desc.id}`,
            path: descPath,
            id: desc.id
          });
        }
        seenIds.add(desc.id);
      }

      // E003 - Invalid type value
      if (desc.type && !VALID_TYPES.includes(desc.type)) {
        errors.push({
          code: 'E003',
          severity: 'error',
          message: `Invalid type value: ${desc.type}. Must be one of: ${VALID_TYPES.join(', ')}`,
          path: descPath,
          id: desc.id
        });
      }

      // E002 - Missing rt for transitions
      const isTransition = desc.type && ['safe', 'unsafe', 'idempotent'].includes(desc.type);
      if (isTransition && !desc.rt) {
        errors.push({
          code: 'E002',
          severity: 'error',
          message: `Missing rt (return type) for ${desc.type} transition`,
          path: descPath,
          id: desc.id
        });
      }

      // E004 - Broken reference (href)
      if (desc.href && desc.href.startsWith('#')) {
        const refId = desc.href.slice(1);
        if (!allIds.has(refId)) {
          errors.push({
            code: 'E004',
            severity: 'error',
            message: `Broken reference: ${desc.href} does not exist`,
            path: descPath,
            id: desc.id
          });
        }
        referencedIds.add(refId);
      }

      // E004 - Broken reference (rt)
      if (desc.rt && desc.rt.startsWith('#')) {
        const refId = desc.rt.slice(1);
        if (!allIds.has(refId)) {
          errors.push({
            code: 'E004',
            severity: 'error',
            message: `Broken reference: ${desc.rt} does not exist`,
            path: descPath,
            id: desc.id
          });
        }
        referencedIds.add(refId);
      }

      // E011 - Tag must be string
      if (desc.tag && Array.isArray(desc.tag)) {
        errors.push({
          code: 'E011',
          severity: 'error',
          message: 'Tag must be a space-separated string, not an array',
          path: descPath,
          id: desc.id
        });
      }

      // W002 - Safe transitions should start with "go"
      if (desc.type === 'safe' && desc.id && !desc.id.startsWith('go')) {
        warnings.push({
          code: 'W002',
          severity: 'warning',
          message: `Safe transition "${desc.id}" should start with "go"`,
          path: descPath,
          id: desc.id
        });
      }

      // W003 - Unsafe/idempotent transitions should start with "do"
      if ((desc.type === 'unsafe' || desc.type === 'idempotent') && desc.id && !desc.id.startsWith('do')) {
        warnings.push({
          code: 'W003',
          severity: 'warning',
          message: `${desc.type} transition "${desc.id}" should start with "do"`,
          path: descPath,
          id: desc.id
        });
      }

      // S001 - Consider adding doc to transitions
      if (isTransition && !desc.doc) {
        suggestions.push({
          code: 'S001',
          severity: 'suggestion',
          message: `Consider adding doc to transition "${desc.id}"`,
          path: descPath,
          id: desc.id
        });
      }

      // Recurse into nested descriptors
      if (desc.descriptor && Array.isArray(desc.descriptor)) {
        this.validateDescriptors(
          desc.descriptor,
          allIds,
          referencedIds,
          errors,
          warnings,
          suggestions,
          `${descPath}.descriptor`
        );
      }
    }
  }
}
