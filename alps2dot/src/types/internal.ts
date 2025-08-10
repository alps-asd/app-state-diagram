import { Descriptor, DescriptorType } from './alps';

export interface InternalModel {
  title?: string;
  description?: string;
  nodes: InternalNode[];
  links: InternalLink[];
}

export interface InternalNode {
  id: string;
  type: DescriptorType;
  title?: string;
  description?: string;
  isTransition: boolean;
  semanticFields: string[];
}

export interface InternalLink {
  from: string;
  to: string;
  relation?: string;
  type: 'transition' | 'reference';
  transitionId?: string;
  transitionType?: DescriptorType;
  transitionTitle?: string;
}

export interface ResolvedDescriptor extends Descriptor {
  resolvedId: string;
  isResolved: boolean;
  parent?: ResolvedDescriptor;
}