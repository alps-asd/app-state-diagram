/**
 * ALPS Type Definitions
 *
 * Minimal type definitions for ALPS documents.
 * These types are compatible with @alps-asd/cli but don't require it as a dependency.
 */

export interface AlpsDescriptor {
  id?: string;
  type?: 'semantic' | 'safe' | 'unsafe' | 'idempotent';
  title?: string;
  def?: string;
  doc?: string | { value: string; format?: string };
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
    doc?: string | { value: string; format?: string };
    descriptor?: AlpsDescriptor[];
    link?: AlpsLink | AlpsLink[];
  };
}
