import { AlpsDocument, AlpsDescriptor } from '../parser/alps-parser';

/**
 * Result of merging ALPS documents
 */
export interface MergeResult {
  /** Merged base document */
  merged: AlpsDocument;
  /** Conflicts that need manual resolution */
  conflicts: AlpsDescriptor[];
  /** Statistics about the merge */
  stats: {
    added: number;
    skipped: number; // duplicates
    conflicts: number;
  };
}

/**
 * Merges ALPS documents
 *
 * Merges descriptors from source into base, detecting conflicts when
 * the same ID exists in both with different definitions.
 */
export class AlpsMerger {
  /**
   * Merge source descriptors into base
   *
   * @param base Base ALPS document (will be modified)
   * @param source Source ALPS document to merge in
   * @returns Merge result with conflicts
   */
  merge(base: AlpsDocument, source: AlpsDocument): MergeResult {
    const baseDescriptors = base.alps.descriptor || [];
    const sourceDescriptors = source.alps.descriptor || [];

    const conflicts: AlpsDescriptor[] = [];
    let added = 0;
    let skipped = 0;

    const baseIds = new Map<string, AlpsDescriptor>();

    // Index base descriptors by ID
    for (const desc of baseDescriptors) {
      if (desc.id) {
        baseIds.set(desc.id, desc);
      }
    }

    // Process source descriptors
    for (const sourceDesc of sourceDescriptors) {
      if (!sourceDesc.id) {
        // Descriptors without IDs are always added
        baseDescriptors.push(sourceDesc);
        added++;
        continue;
      }

      const existingDesc = baseIds.get(sourceDesc.id);

      if (!existingDesc) {
        // New descriptor, add it
        baseDescriptors.push(sourceDesc);
        baseIds.set(sourceDesc.id, sourceDesc);
        added++;
      } else if (this.areDescriptorsEqual(existingDesc, sourceDesc)) {
        // Exact duplicate, skip
        skipped++;
      } else {
        // Conflict: same ID, different definition
        conflicts.push(sourceDesc);
      }
    }

    return {
      merged: {
        ...base,
        alps: {
          ...base.alps,
          descriptor: baseDescriptors,
        },
      },
      conflicts,
      stats: {
        added,
        skipped,
        conflicts: conflicts.length,
      },
    };
  }

  /**
   * Check if two descriptors are semantically equal
   * (ignoring order of nested fields)
   */
  private areDescriptorsEqual(a: AlpsDescriptor, b: AlpsDescriptor): boolean {
    // Simple deep equality check
    // TODO: Could be more sophisticated (ignore field order, etc.)
    return JSON.stringify(this.normalizeDescriptor(a)) ===
           JSON.stringify(this.normalizeDescriptor(b));
  }

  /**
   * Normalize descriptor for comparison
   * (sort arrays, remove undefined fields, etc.)
   */
  private normalizeDescriptor(desc: AlpsDescriptor): any {
    const normalized: any = {};

    // Copy fields in sorted order
    const keys = Object.keys(desc).sort();
    for (const key of keys) {
      const value = (desc as any)[key];

      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        normalized[key] = value.map(v =>
          typeof v === 'object' ? this.normalizeDescriptor(v) : v
        );
      } else if (typeof value === 'object' && value !== null) {
        normalized[key] = this.normalizeDescriptor(value);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }
}