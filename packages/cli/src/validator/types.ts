export type Severity = 'error' | 'warning' | 'suggestion';

export interface ValidationIssue {
  code: string;
  severity: Severity;
  message: string;
  path?: string;
  id?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
}
