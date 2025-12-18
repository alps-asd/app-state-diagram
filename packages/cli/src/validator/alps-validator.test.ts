import { AlpsValidator } from './alps-validator';

describe('AlpsValidator', () => {
  let validator: AlpsValidator;

  beforeEach(() => {
    validator = new AlpsValidator();
  });

  describe('E001 - Missing id or href', () => {
    it('should error when descriptor has neither id nor href', () => {
      const alps = {
        alps: {
          descriptor: [{ type: 'semantic' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E001' })
      );
    });

    it('should pass when descriptor has id', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E001')).toHaveLength(0);
    });

    it('should pass when descriptor has href', () => {
      const alps = {
        alps: {
          descriptor: [{ href: '#other' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E001')).toHaveLength(0);
    });
  });

  describe('E002 - Missing rt for transitions', () => {
    it('should error when safe transition has no rt', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'goTest', type: 'safe' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E002' })
      );
    });

    it('should pass when safe transition has rt', () => {
      const alps = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E002')).toHaveLength(0);
    });
  });

  describe('E003 - Invalid type value', () => {
    it('should error when type is invalid', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test', type: 'invalid' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E003' })
      );
    });

    it('should pass for valid types', () => {
      const alps = {
        alps: {
          descriptor: [
            { id: 'test1', type: 'semantic' },
            { id: 'test2', type: 'safe' },
            { id: 'test3', type: 'unsafe' },
            { id: 'test4', type: 'idempotent' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E003')).toHaveLength(0);
    });
  });

  describe('E004 - Broken reference', () => {
    it('should error when href points to non-existent id', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test', href: '#nonexistent' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E004' })
      );
    });

    it('should error when rt points to non-existent id', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'goTest', type: 'safe', rt: '#nonexistent' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E004' })
      );
    });

    it('should pass for external URLs', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test', href: 'https://example.com/alps#foo' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E004')).toHaveLength(0);
    });
    it('should pass for valid internal references', () => {
      const alps = {
        alps: {
          descriptor: [
            { id: 'target' },
            { id: 'ref', href: '#target' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E004')).toHaveLength(0);
    });

  });

  describe('E005 - Duplicate id', () => {
    it('should error when duplicate ids exist', () => {
      const alps = {
        alps: {
          descriptor: [
            { id: 'test' },
            { id: 'test' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E005' })
      );
    });
  });

  describe('E008 - Missing alps property', () => {
    it('should error when alps property is missing', () => {
      const alps = { descriptor: [] };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E008' })
      );
    });
  });

  describe('E009 - Missing descriptor array', () => {
    it('should error when descriptor is missing', () => {
      const alps = { alps: {} };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E009' })
      );
    });
  });

  describe('E011 - Tag must be string', () => {
    it('should error when tag is array', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test', tag: ['tag1', 'tag2'] }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E011' })
      );
    });

    it('should pass when tag is string', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test', tag: 'tag1 tag2' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E011')).toHaveLength(0);
    });
  });

  describe('W001 - Missing title', () => {
    it('should warn when alps has no title', () => {
      const alps = {
        alps: {
          descriptor: [{ id: 'test' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'W001' })
      );
    });
  });

  describe('W002 - Safe transition naming', () => {
    it('should warn when safe transition does not start with go', () => {
      const alps = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'showHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'W002' })
      );
    });
  });

  describe('W003 - Unsafe/idempotent transition naming', () => {
    it('should warn when unsafe transition does not start with do', () => {
      const alps = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'createItem', type: 'unsafe', rt: '#Home' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'W003' })
      );
    });
  });

  describe('Nested descriptors', () => {
    it('should validate nested descriptors', () => {
      const alps = {
        alps: {
          title: 'Test',
          descriptor: [
            {
              id: 'Parent',
              descriptor: [
                { id: 'child1' },
                { id: 'child2', type: 'safe', rt: '#Parent' }
              ]
            }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.isValid).toBe(true);
    });

    it('should error on nested descriptor without id', () => {
      const alps = {
        alps: {
          descriptor: [
            {
              id: 'Parent',
              descriptor: [
                { type: 'semantic' }
              ]
            }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'E001' })
      );
    });

    it('should find ids in nested descriptors for reference checking', () => {
      const alps = {
        alps: {
          descriptor: [
            {
              id: 'Parent',
              descriptor: [
                { id: 'NestedTarget' }
              ]
            },
            { id: 'goNested', type: 'safe', rt: '#NestedTarget' }
          ]
        }
      };
      const result = validator.validate(alps);
      expect(result.errors.filter(e => e.code === 'E004')).toHaveLength(0);
    });
  });

  describe('isValid', () => {
    it('should be true when no errors', () => {
      const alps = {
        alps: {
          title: 'Test',
          descriptor: [{ id: 'test' }]
        }
      };
      const result = validator.validate(alps);
      expect(result.isValid).toBe(true);
    });

    it('should be false when errors exist', () => {
      const alps = { alps: {} };
      const result = validator.validate(alps);
      expect(result.isValid).toBe(false);
    });
  });
});
