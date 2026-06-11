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

      expect(dot).toContain('FONT COLOR="#00A86B"'); // safe - green
      expect(dot).toContain('FONT COLOR="#FF4136"'); // unsafe - red
      expect(dot).toContain('FONT COLOR="#D4A000"'); // idempotent - yellow
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
      // Transition label is inside HTML TABLE
      expect(dot).toContain('goHome</TD>');
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
      // Transition label is inside HTML TABLE
      expect(dot).toContain('Go Home</TD>');
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
      // Transition label is inside HTML TABLE
      expect(dot).toContain('goHome</TD>');
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
    expect(dot).toContain('FONT COLOR="#000000"'); // default black
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

  it('should group multiple transitions between same states into single edge', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Client',
            descriptor: [
              { href: '#goUpdateClient' },
              { href: '#doActivateClient' }
            ]
          },
          { id: 'goUpdateClient', type: 'safe', rt: '#Client', title: 'Update Client' },
          { id: 'doActivateClient', type: 'unsafe', rt: '#Client', title: 'Activate Client' }
        ]
      }
    };
    const dot = generateDot(alps);

    // Should have only one edge between Client and Client
    const edgeCount = (dot.match(/Client -> Client/g) || []).length;
    expect(edgeCount).toBe(1);

    // Should contain both transition labels in the same TABLE
    expect(dot).toContain('goUpdateClient');
    expect(dot).toContain('doActivateClient');
    expect(dot).toContain('<TABLE');
    expect(dot).toContain('FONT COLOR="#00A86B"'); // safe
    expect(dot).toContain('FONT COLOR="#FF4136"'); // unsafe
  });

  it('should keep separate edges for different source-target pairs', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Home',
            descriptor: [
              { href: '#goAbout' },
              { href: '#goContact' }
            ]
          },
          { id: 'About' },
          { id: 'Contact' },
          { id: 'goAbout', type: 'safe', rt: '#About' },
          { id: 'goContact', type: 'safe', rt: '#Contact' }
        ]
      }
    };
    const dot = generateDot(alps);

    // Should have separate edges
    expect(dot).toContain('Home -> About');
    expect(dot).toContain('Home -> Contact');
  });

  it('buildRelationshipMap should handle missing alps property', () => {
    const alps: AlpsDocument = {} as any;
    const map = buildRelationshipMap(alps);
    expect(map.childrenOf).toEqual({});
  });

  it('should escape IDs with special characters', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'my-state' }, // contains hyphen
          { id: 'goToState', type: 'safe', rt: '#my-state' }
        ]
      }
    };
    const dot = generateDot(alps);
    // ID should be quoted because it contains a hyphen
    expect(dot).toContain('"my-state"');
  });

  it('should use black edge color for idempotent transitions', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Home',
            descriptor: [{ href: '#doUpdate' }]
          },
          { id: 'doUpdate', type: 'idempotent', rt: '#Home' }
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).toContain('color="#000000"');
  });

  it('should use gray edge color for safe-only grouped transitions', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Home',
            descriptor: [{ href: '#goA' }, { href: '#goB' }]
          },
          { id: 'Target' },
          { id: 'goA', type: 'safe', rt: '#Target' },
          { id: 'goB', type: 'safe', rt: '#Target' }
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).toContain('color="#99999977"');
  });

  it('should escape & in HTML TABLE labels', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home' },
          { id: 'goSave', type: 'safe', rt: '#Home', title: 'Subscribe & Save' }
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).toContain('Subscribe &amp; Save');
    expect(dot).not.toMatch(/TOOLTIP="[^"]*Subscribe & Save/);
  });

  it('should use black edge color for single unsafe transition', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          {
            id: 'Home',
            descriptor: [{ href: '#doDelete' }]
          },
          { id: 'Deleted' },
          { id: 'doDelete', type: 'unsafe', rt: '#Deleted' }
        ]
      }
    };
    const dot = generateDot(alps);
    expect(dot).toContain('Home -> Deleted');
    expect(dot).toContain('color="#000000"');
  });

  it('should render the induced subgraph for filter ids', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home', descriptor: [{ href: '#goCart' }, { href: '#goAdmin' }] },
          { id: 'Cart' },
          { id: 'AdminTop' },
          { id: 'goCart', type: 'safe', rt: '#Cart', tag: 'cart' },
          { id: 'goAdmin', type: 'safe', rt: '#AdminTop', tag: 'admin' }
        ]
      }
    };

    const dot = generateDot(alps, 'id', new Set(['goCart']));

    expect(dot).toContain('Home -> Cart');
    expect(dot).not.toContain('AdminTop');
    expect(dot).not.toContain('goAdmin');
  });

  it('should return an empty DOT fragment when filter ids match no states', () => {
    const alps: AlpsDocument = {
      alps: {
        descriptor: [
          { id: 'Home', descriptor: [{ href: '#goCart' }] },
          { id: 'Cart' },
          { id: 'goCart', type: 'safe', rt: '#Cart' }
        ]
      }
    };

    expect(generateDot(alps, 'id', new Set(['missing']))).toBe('');
  });

});
