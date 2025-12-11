export interface AlpsDocument {
  alps: Alps;
}

export interface Alps {
  version?: string;
  title?: string;
  doc?: Documentation | string;
  descriptor: Descriptor[];
}

export interface Documentation {
  value: string;
  format?: 'text' | 'html' | 'markdown';
  href?: string;
}

export interface Descriptor {
  id?: string;
  href?: string;
  name?: string;
  type?: 'semantic' | 'safe' | 'unsafe' | 'idempotent';
  title?: string;
  doc?: Documentation | string;
  descriptor?: Descriptor[];
  rt?: string;
  rel?: string;
  tag?: string;
}

export type DescriptorType = 'semantic' | 'safe' | 'unsafe' | 'idempotent';

export interface ValidationIssue {
  code: string;
  message: string;
  path?: string;
  descriptorId?: string;
}

export interface ValidationSummary {
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  summary: ValidationSummary;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
}

// Error codes
export const ErrorCodes = {
  MISSING_ID_OR_HREF: 'E001',
  MISSING_RT: 'E002',
  INVALID_TYPE: 'E003',
  BROKEN_REFERENCE: 'E004',
  DUPLICATE_ID: 'E005',
  INVALID_HREF: 'E006',
  INVALID_RT_FORMAT: 'E007',
  MISSING_ALPS: 'E008',
  MISSING_DESCRIPTOR_ARRAY: 'E009',
  INVALID_XML_CHAR: 'E010',
  TAG_MUST_BE_STRING: 'E011',
} as const;

// Warning codes
export const WarningCodes = {
  MISSING_TITLE: 'W001',
  NAMING_CONVENTION_SAFE: 'W002',
  NAMING_CONVENTION_UNSAFE: 'W003',
  ORPHAN_DESCRIPTOR: 'W004',
  SAFE_TRANSITION_RT_MISMATCH: 'W005',
  TAG_CONTAINS_COMMA: 'W006',
} as const;

// Suggestion codes
export const SuggestionCodes = {
  MISSING_DOC: 'S001',
  MISSING_ALPS_TITLE: 'S002',
  MISSING_ALPS_DOC: 'S003',
} as const;