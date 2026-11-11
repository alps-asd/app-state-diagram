import { generateHtml } from './html-generator';
import { AlpsDocument } from '../parser/alps-parser';

const doc: AlpsDocument = {
  alps: {
    title: 'Test Profile',
    descriptor: [
      { id: 'Home' },
      { id: 'goHome', type: 'safe', rt: '#Home' }
    ]
  }
};

describe('generateHtml 3D branching', () => {
  it('omits all 3D markers when enable3d is false', () => {
    const html = generateHtml(doc, '<svg></svg>', '', 'botanical', false);

    expect(html).not.toContain('asd3d-open');
    expect(html).not.toContain('asd3d-overlay');
    expect(html).not.toContain('asd3dScript');
    expect(html).not.toContain('ASD3D_THEME');
  });

  it('includes the 3D open button, overlay and script when enable3d is true', () => {
    const html = generateHtml(doc, '<svg></svg>', '', 'botanical', true);

    expect(html).toContain('id="asd3d-open"');
    expect(html).toContain('id="asd3d-overlay"');
    expect(html).toContain('ASD3D_THEME');
    expect(html).toContain('3D Browse Mode');
  });

  it('whitelists the theme: unknown names fall back to botanical', () => {
    const html = generateHtml(doc, '<svg></svg>', '', 'not-a-theme', true);

    expect(html).toContain('ASD3D_THEME = "botanical"');
    expect(html).not.toContain('ASD3D_THEME = "not-a-theme"');
  });

  it('accepts the cosmos theme', () => {
    const html = generateHtml(doc, '<svg></svg>', '', 'cosmos', true);

    expect(html).toContain('ASD3D_THEME = "cosmos"');
  });

  it('escapes the profile title inside the 3D overlay', () => {
    const evil: AlpsDocument = {
      alps: {
        title: '"><script>alert(1)</script>',
        descriptor: [{ id: 'Home' }]
      }
    };
    const html = generateHtml(evil, '<svg></svg>', '', 'botanical', true);

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
