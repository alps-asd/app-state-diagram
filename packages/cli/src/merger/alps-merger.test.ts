import { AlpsMerger } from './alps-merger';
import { AlpsDocument } from '../parser/alps-parser';

describe('AlpsMerger', () => {
  let merger: AlpsMerger;

  beforeEach(() => {
    merger = new AlpsMerger();
  });

  describe('merge()', () => {
    it('should add new descriptors from source to base', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userName', title: 'User Name' },
          ],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(2);
      expect(result.stats.added).toBe(1);
      expect(result.stats.skipped).toBe(0);
      expect(result.stats.conflicts).toBe(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should skip exact duplicate descriptors', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID', def: 'https://schema.org/identifier' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID', def: 'https://schema.org/identifier' },
          ],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.added).toBe(0);
      expect(result.stats.skipped).toBe(1);
      expect(result.stats.conflicts).toBe(0);
    });

    it('should detect conflicts when same ID has different definition', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User Identifier', def: 'https://schema.org/identifier' },
          ],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.added).toBe(0);
      expect(result.stats.skipped).toBe(0);
      expect(result.stats.conflicts).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('userId');
      expect(result.conflicts[0].title).toBe('User Identifier');
    });

    it('should handle descriptors without IDs', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { title: 'Anonymous descriptor' },
          ],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(2);
      expect(result.stats.added).toBe(1);
    });

    it('should handle empty descriptor arrays', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.added).toBe(0);
      expect(result.stats.skipped).toBe(0);
      expect(result.stats.conflicts).toBe(0);
    });

    it('should merge multiple new descriptors', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userName', title: 'User Name' },
            { id: 'userEmail', title: 'User Email' },
            { id: 'userAge', title: 'User Age' },
          ],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(4);
      expect(result.stats.added).toBe(3);
      expect(result.stats.skipped).toBe(0);
      expect(result.stats.conflicts).toBe(0);
    });

    it('should handle mix of new, duplicate, and conflicting descriptors', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
            { id: 'userName', title: 'User Name' },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' }, // exact duplicate
            { id: 'userName', title: 'Full Name' }, // conflict
            { id: 'userEmail', title: 'Email' }, // new
          ],
        },
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(3);
      expect(result.stats.added).toBe(1);
      expect(result.stats.skipped).toBe(1);
      expect(result.stats.conflicts).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('userName');
    });

    it('should handle descriptors with undefined properties during normalization', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID', def: undefined },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'userId', title: 'User ID' },
          ],
        },
      };

      const result = merger.merge(base, source);

      // Should be treated as duplicates since undefined is normalized away
      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.added).toBe(0);
      expect(result.stats.skipped).toBe(1);
      expect(result.stats.conflicts).toBe(0);
    });

    it('should normalize descriptors with array properties containing objects', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'user',
              title: 'User',
              descriptor: [
                { id: 'name', title: 'Name' },
                { id: 'email', title: 'Email' },
              ],
            },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'user',
              title: 'User',
              descriptor: [
                { id: 'name', title: 'Name' },
                { id: 'email', title: 'Email' },
              ],
            },
          ],
        },
      };

      const result = merger.merge(base, source);

      // Should recognize as duplicates even with nested arrays
      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.added).toBe(0);
      expect(result.stats.skipped).toBe(1);
      expect(result.stats.conflicts).toBe(0);
    });

    it('should normalize descriptors with nested object properties', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'user',
              title: 'User',
              doc: {
                value: 'User documentation',
              },
              descriptor: [
                {
                  id: 'profile',
                  title: 'Profile',
                  doc: { value: 'User profile information' },
                },
              ],
            },
          ],
        },
      };

      const source: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'user',
              title: 'User',
              doc: {
                value: 'User documentation',
              },
              descriptor: [
                {
                  id: 'profile',
                  title: 'Profile',
                  doc: { value: 'User profile information' },
                },
              ],
            },
          ],
        },
      };

      const result = merger.merge(base, source);

      // Should recognize as duplicates even with nested objects
      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.added).toBe(0);
      expect(result.stats.skipped).toBe(1);
      expect(result.stats.conflicts).toBe(0);
    });

    it('should handle missing descriptor property in alps document', () => {
      const base: AlpsDocument = { alps: {} } as any;
      const source: AlpsDocument = { alps: {} } as any;

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(0);
      expect(result.stats.added).toBe(0);
    });

    it('should normalize descriptors with array properties containing primitives', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'item', tag: ['a', 'b'] } as any
          ]
        }
      };
      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'item', tag: ['a', 'b'] } as any
          ]
        }
      };

      const result = merger.merge(base, source);

      expect(result.merged.alps.descriptor).toHaveLength(1);
      expect(result.stats.skipped).toBe(1);
    });

    it('should ignore descriptors without id in base document', () => {
      const base: AlpsDocument = {
        alps: {
          descriptor: [
            { title: 'No ID' }
          ]
        }
      };
      const source: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'item' }
          ]
        }
      };

      const result = merger.merge(base, source);

      // The no-id descriptor is ignored for conflict checking but preserved in output?
      // Wait, code: if (desc.id) baseIds.set... else nothing. 
      // It is NOT removed from baseDescriptors array.
      // So output should have 2 descriptors.
      expect(result.merged.alps.descriptor).toHaveLength(2);
    });
  });
});