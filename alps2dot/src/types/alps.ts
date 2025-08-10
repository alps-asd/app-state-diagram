export interface AlpsDocument {
  alps: Alps;
}

export interface Alps {
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
}

export type DescriptorType = 'semantic' | 'safe' | 'unsafe' | 'idempotent';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}