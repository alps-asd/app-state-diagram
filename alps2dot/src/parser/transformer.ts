import { AlpsDocument, Descriptor, DescriptorType } from '../types/alps';
import { InternalModel, InternalNode, InternalLink, ResolvedDescriptor } from '../types/internal';

export class AlpsTransformer {
  transform(document: AlpsDocument): InternalModel {
    const descriptors = this.resolveReferences(document.alps.descriptor);
    const nodes = this.createNodes(descriptors);
    const links = this.createLinks(descriptors);

    return {
      title: document.alps.title,
      description: this.extractDocumentation(document.alps.doc),
      nodes,
      links
    };
  }

  private resolveReferences(descriptors: Descriptor[]): ResolvedDescriptor[] {
    const descriptorMap = new Map<string, Descriptor>();
    
    // Build a map of all descriptors by ID
    this.buildDescriptorMap(descriptors, descriptorMap);
    
    // Resolve references
    return descriptors.map(desc => this.resolveDescriptor(desc, descriptorMap));
  }

  private buildDescriptorMap(descriptors: Descriptor[], map: Map<string, Descriptor>): void {
    for (const desc of descriptors) {
      if (desc.id) {
        map.set(desc.id, desc);
      }
      
      if (desc.descriptor) {
        this.buildDescriptorMap(desc.descriptor, map);
      }
    }
  }

  private resolveDescriptor(
    descriptor: Descriptor,
    map: Map<string, Descriptor>,
    parent?: ResolvedDescriptor
  ): ResolvedDescriptor {
    let resolvedId: string;
    let isResolved: boolean;
    let resolvedType = descriptor.type;
    let resolvedTitle = descriptor.title;
    let resolvedDoc = descriptor.doc;

    if (descriptor.id) {
      resolvedId = descriptor.id;
      isResolved = true;
    } else if (descriptor.href && descriptor.href.startsWith('#')) {
      const referencedId = descriptor.href.substring(1);
      const referenced = map.get(referencedId);
      
      if (referenced) {
        resolvedId = referencedId;
        isResolved = true;
        // Use properties from the referenced descriptor if not present in current
        resolvedType = descriptor.type || referenced.type;
        resolvedTitle = descriptor.title || referenced.title;
        resolvedDoc = descriptor.doc || referenced.doc;
      } else {
        resolvedId = descriptor.href;
        isResolved = false;
      }
    } else {
      resolvedId = descriptor.href || 'unknown';
      isResolved = false;
    }

    const resolved: ResolvedDescriptor = {
      ...descriptor,
      type: resolvedType,
      title: resolvedTitle,
      doc: resolvedDoc,
      resolvedId,
      isResolved,
      parent
    };

    // Resolve nested descriptors
    if (descriptor.descriptor) {
      resolved.descriptor = descriptor.descriptor.map(nested => 
        this.resolveDescriptor(nested, map, resolved)
      );
    }

    return resolved;
  }

  private createNodes(descriptors: ResolvedDescriptor[]): InternalNode[] {
    const nodes: InternalNode[] = [];
    const processedIds = new Set<string>();

    this.processDescriptorsForNodes(descriptors, nodes, processedIds);
    
    return nodes;
  }

  private processDescriptorsForNodes(
    descriptors: ResolvedDescriptor[],
    nodes: InternalNode[],
    processedIds: Set<string>
  ): void {
    for (const desc of descriptors) {
      if (!processedIds.has(desc.resolvedId) && desc.isResolved) {
        const node = this.createNode(desc);
        nodes.push(node);
        processedIds.add(desc.resolvedId);
      }

      if (desc.descriptor) {
        this.processDescriptorsForNodes(desc.descriptor as ResolvedDescriptor[], nodes, processedIds);
      }
    }
  }

  private createNode(descriptor: ResolvedDescriptor): InternalNode {
    const type = descriptor.type || 'semantic';
    const isTransition = this.isTransitionDescriptor(type);
    const semanticFields = this.extractSemanticFields(descriptor);

    return {
      id: descriptor.resolvedId,
      type: type as DescriptorType,
      title: descriptor.title || descriptor.resolvedId,
      description: this.extractDocumentation(descriptor.doc),
      isTransition,
      semanticFields
    };
  }

  private isTransitionDescriptor(type: string): boolean {
    return ['safe', 'unsafe', 'idempotent'].includes(type);
  }

  private extractSemanticFields(descriptor: ResolvedDescriptor): string[] {
    const fields: string[] = [];
    
    if (descriptor.descriptor) {
      for (const nested of descriptor.descriptor) {
        const resolvedNested = nested as ResolvedDescriptor;
        
        // PHP版のgetNodeProps()と同じ2つの条件
        // 1. semantic href: href参照でかつ参照先がsemantic
        if (resolvedNested.href && resolvedNested.isResolved && 
            (!resolvedNested.type || resolvedNested.type === 'semantic')) {
          fields.push(resolvedNested.resolvedId);
        }
        
        // 2. semantic type: 明示的にtype="semantic"
        if (resolvedNested.type === 'semantic' && resolvedNested.resolvedId) {
          fields.push(resolvedNested.resolvedId);
        }
      }
    }

    return fields;
  }

  private createLinks(descriptors: ResolvedDescriptor[]): InternalLink[] {
    const links: InternalLink[] = [];
    
    this.processDescriptorsForLinks(descriptors, links);
    
    return links;
  }

  private processDescriptorsForLinks(
    descriptors: ResolvedDescriptor[],
    links: InternalLink[]
  ): void {
    // 全descriptorをマップ化
    const descriptorMap = new Map<string, ResolvedDescriptor>();
    this.buildDescriptorMapFromResolved(descriptors, descriptorMap);

    for (const desc of descriptors) {
      if (desc.descriptor && desc.isResolved) {
        for (const nested of desc.descriptor) {
          const resolvedNested = nested as ResolvedDescriptor;
          
          // 1. href参照先がTransDescriptorの場合のリンク作成
          if (resolvedNested.href && resolvedNested.href.startsWith('#')) {
            const referencedId = resolvedNested.href.substring(1);
            const referenced = descriptorMap.get(referencedId);
            
            if (referenced && this.isTransitionDescriptor(referenced.type || 'semantic')) {
              const toId = referenced.rt ? referenced.rt.replace('#', '') : referenced.resolvedId;
              
              links.push({
                from: desc.resolvedId,
                to: toId,
                relation: referenced.rel,
                type: 'transition',
                transitionId: referenced.resolvedId,
                transitionType: referenced.type as DescriptorType,
                transitionTitle: referenced.title
              });
            }
          }
          
          // 2. ネストされたdescriptor自体がTransDescriptorの場合のリンク作成
          if (resolvedNested.id && this.isTransitionDescriptor(resolvedNested.type || 'semantic')) {
            const toId = resolvedNested.rt ? resolvedNested.rt.replace('#', '') : resolvedNested.resolvedId;
            
            links.push({
              from: desc.resolvedId,
              to: toId,
              relation: resolvedNested.rel,
              type: 'transition',
              transitionId: resolvedNested.resolvedId,
              transitionType: resolvedNested.type as DescriptorType,
              transitionTitle: resolvedNested.title
            });
          }
        }
      }

      if (desc.descriptor) {
        this.processDescriptorsForLinks(desc.descriptor as ResolvedDescriptor[], links);
      }
    }
  }

  private buildDescriptorMapFromResolved(descriptors: ResolvedDescriptor[], map: Map<string, ResolvedDescriptor>): void {
    for (const desc of descriptors) {
      if (desc.isResolved) {
        map.set(desc.resolvedId, desc);
      }
      
      if (desc.descriptor) {
        this.buildDescriptorMapFromResolved(desc.descriptor as ResolvedDescriptor[], map);
      }
    }
  }

  private extractDocumentation(doc: any): string | undefined {
    if (typeof doc === 'string') {
      return doc;
    }
    
    if (doc && typeof doc === 'object' && doc.value) {
      return doc.value;
    }
    
    return undefined;
  }
}