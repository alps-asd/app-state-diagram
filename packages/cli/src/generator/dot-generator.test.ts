import { generateDot, buildRelationshipMap } from './dot-generator';
import { AlpsDocument } from '../parser/alps-parser';

describe('DotGenerator', () => {
  describe('generateDot', () => {
    it('should generate valid DOT structure', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('digraph application_state_diagram');
      expect(dot).toContain('graph [');
      expect(dot).toContain('node [shape = box');
    });

    it('should create state nodes from rt targets', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'About' },
            { id: 'goHome', type: 'safe', rt: '#Home' },
            { id: 'goAbout', type: 'safe', rt: '#About' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('Home [');
      expect(dot).toContain('About [');
    });

    it('should not create state nodes for non-rt-targeted descriptors', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'NotAState' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('Home [');
      expect(dot).not.toMatch(/NotAState \[/);
    });

    it('should generate transitions with correct colors', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goSafe', type: 'safe', rt: '#Home' },
            { id: 'doUnsafe', type: 'unsafe', rt: '#Home' },
            { id: 'doIdempotent', type: 'idempotent', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('color="#00A86B"'); // safe - green
      expect(dot).toContain('color="#FF4136"'); // unsafe - red
      expect(dot).toContain('color="#D4A000"'); // idempotent - yellow
    });

    it('should use id as label by default', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'HomePage', title: 'Home Page Title' },
            { id: 'goHome', type: 'safe', rt: '#HomePage', title: 'Go Home' }
          ]
        }
      };
      const dot = generateDot(alps, 'id');

      expect(dot).toContain('label="HomePage"');
      expect(dot).toContain('label="goHome"');
    });

    it('should use title as label when labelMode is title', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'HomePage', title: 'Home Page Title' },
            { id: 'goHome', type: 'safe', rt: '#HomePage', title: 'Go Home' }
          ]
        }
      };
      const dot = generateDot(alps, 'title');

      expect(dot).toContain('label="Home Page Title"');
      expect(dot).toContain('label="Go Home"');
    });

    it('should fall back to id when title is missing', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'HomePage' },
            { id: 'goHome', type: 'safe', rt: '#HomePage' }
          ]
        }
      };
      const dot = generateDot(alps, 'title');

      expect(dot).toContain('label="HomePage"');
      expect(dot).toContain('label="goHome"');
    });

    it('should find source states for transitions', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Home',
              descriptor: [
                { href: '#goAbout' }
              ]
            },
            { id: 'About' },
            { id: 'goAbout', type: 'safe', rt: '#About' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('Home -> About');
    });

    it('should use UnknownState when source not found', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('UnknownState -> Home');
    });

    it('should handle empty descriptor array', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('digraph application_state_diagram');
      expect(dot).toContain('}');
    });

    it('should handle missing alps property', () => {
      const alps = {} as AlpsDocument;
      const dot = generateDot(alps);

      expect(dot).toContain('digraph application_state_diagram');
    });

    it('should include URL attributes for navigation', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Home' },
            { id: 'goHome', type: 'safe', rt: '#Home' }
          ]
        }
      };
      const dot = generateDot(alps);

      expect(dot).toContain('URL="#Home"');
      expect(dot).toContain('URL="#goHome"');
    });
  });

  describe('buildRelationshipMap', () => {
    it('should build parent-child relationships', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            {
              id: 'Parent',
              descriptor: [
                { id: 'child1' },
                { href: '#child2' }
              ]
            },
            { id: 'child2' }
          ]
        }
      };
      const map = buildRelationshipMap(alps);

      expect(map.childrenOf['Parent']).toContain('child1');
      expect(map.childrenOf['Parent']).toContain('child2');
      expect(map.parentOf['child1']).toContain('Parent');
      expect(map.parentOf['child2']).toContain('Parent');
    });

    it('should handle empty descriptor', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: []
        }
      };
      const map = buildRelationshipMap(alps);

      expect(map.parentOf).toEqual({});
      expect(map.childrenOf).toEqual({});
    });

    it('should handle descriptors without children', () => {
      const alps: AlpsDocument = {
        alps: {
          descriptor: [
            { id: 'Lonely' }
          ]
        }
      };
      const map = buildRelationshipMap(alps);

      expect(map.childrenOf['Lonely']).toBeUndefined();
    });
  });
  it('should handle unknown transition type with default color', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home' },
          { id: 'goCustom', type: 'custom' as any, rt: '#Home' }
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).toContain('color=\"#000000\"'); // default black
  });

  it('should ignore transitions without rt', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home' },
          { id: 'goNoRt', type: 'safe' } // no rt
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).not.toContain('goNoRt');
  });

  it('buildRelationshipMap should handle href without hash', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Parent',
            descriptor: [
              { href: 'childNoHash' }
            ]
          },
          { id: 'childNoHash' }
        ]
      }
    };
    const map = buildRelationshipMap(alps);
    expect(map.childrenOf['Parent']).toContain('childNoHash');
    expect(map.parentOf['childNoHash']).toContain('Parent');
  });


  it('should not create state node for descriptor without id', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { rt: '#Home' }, // no id
          { id: 'Home' }
        ]
      }
    };
    const dot = generateDot(alps);
    // should contain Home state but not an empty node
    expect(dot).toContain('Home [');
    expect(dot).not.toMatch(/\[margin=0.1, label=\"\"/);
  });


  it('should find source states even if container descriptor has no id', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            // no id here
            descriptor: [
              { href: '#child' }
            ]
          },
          { id: 'child' },
          { id: 'child', type: 'safe', rt: '#child' } // transition to self
        ]
      }
    };
    const dot = generateDot(alps);
    // fallback logic will create state nodes for child
    expect(dot).toContain('UnknownState -> child');
  });

  it('should ignore transitions without id', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home' },
          { type: 'safe', rt: '#Home' } // no id
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).not.toContain('->');
  });

  it('buildRelationshipMap should ignore children without id or href', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Parent',
            descriptor: [
              {} // no id or href
            ]
          }
        ]
      }
    };
    const map = buildRelationshipMap(alps);
    expect(map.childrenOf['Parent']).toEqual([]);
  });

  it('should find source states using embedded transition id', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Parent',
            descriptor: [
              // This child has same ID as the transition, so it IS the transition embedded/referenced
              { id: 'sharedTrans' }
            ]
          },
          // The transition must exist at top level to be processed by generateDot loop
          { id: 'sharedTrans', type: 'safe', rt: '#child' },
          { id: 'child' }
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).toContain('Parent -> child');
  });



  it('buildRelationshipMap should append to existing parentOf array', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Parent1',
            descriptor: [{ href: '#child' }]
          },
          {
            id: 'Parent2',
            descriptor: [{ href: '#child' }]
          },
          { id: 'child' }
        ]
      }
    };
    const map = buildRelationshipMap(alps);
    expect(map.parentOf['child']).toContain('Parent1');
    expect(map.parentOf['child']).toContain('Parent2');
    expect(map.parentOf['child'].length).toBe(2);
  });


  it('buildRelationshipMap should handle descriptor with empty children array', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Parent',
            descriptor: [] // empty array
          }
        ]
      }
    };
    const map = buildRelationshipMap(alps);
    expect(map.childrenOf['Parent']).toEqual([]);
  });

  it('buildRelationshipMap should handle missing alps property', () => {
    const alps: AlpsDocument = {} as any;
    const map = buildRelationshipMap(alps);
    expect(map.childrenOf).toEqual({});
  });

});
