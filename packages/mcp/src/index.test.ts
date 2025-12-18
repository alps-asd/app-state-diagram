/**
 * MCP Server Handler Tests
 *
 * Tests the MCP tool handlers directly.
 */

const {
  handleValidateAlps,
  handleAlps2Svg,
  handleAlps2Mermaid,
  handleAlpsGuide,
  handleCrawlAndExtract,
  getEmbeddedGuide,
} = require('./index');
const fs = require('fs');

// Mock fs for file reading tests
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MCP Handler Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('handleValidateAlps', () => {
    it('should validate valid ALPS JSON content', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          title: 'Test Profile',
          descriptor: [{ id: 'testDescriptor', type: 'semantic' }],
        },
      });

      const result = await handleValidateAlps({ alps_content: alpsContent });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('✅ ALPS Validation SUCCESSFUL');
    });

    it('should validate valid ALPS XML content', async () => {
      const alpsContent = `<?xml version="1.0"?>
<alps>
  <descriptor id="testDescriptor" type="semantic"/>
</alps>`;

      const result = await handleValidateAlps({ alps_content: alpsContent });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('✅ ALPS Validation SUCCESSFUL');
    });

    it('should detect errors in invalid ALPS', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [{ type: 'semantic' }], // Missing id
        },
      });

      const result = await handleValidateAlps({ alps_content: alpsContent });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('❌ ALPS Validation FAILED');
      expect(result.content[0].text).toContain('E001');
    });

    it('should return error when alps_content is missing', async () => {
      const result = await handleValidateAlps({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: alps_content is required');
    });

    it('should return error when args is undefined', async () => {
      const result = await handleValidateAlps(undefined);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: alps_content is required');
    });

    it('should handle parse errors', async () => {
      const result = await handleValidateAlps({ alps_content: 'invalid json' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should show warnings when present', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [
            { id: 'test', type: 'semantic' },
            { id: 'goSomewhere', type: 'safe' }, // Missing rt
          ],
        },
      });

      const result = await handleValidateAlps({ alps_content: alpsContent });

      expect(result.content[0].text).toContain('Warnings:');
    });
  });

  describe('handleAlps2Svg', () => {
    it('should generate SVG from alps_content', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [
            { id: 'Home', type: 'semantic' },
            { id: 'goHome', type: 'safe', rt: '#Home' },
          ],
        },
      });

      const result = await handleAlps2Svg({ alps_content: alpsContent });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('✅ SVG generated');
      expect(result.content[0].text).toContain('```svg');
    });

    it('should read from alps_path when provided', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [{ id: 'test', type: 'semantic' }],
        },
      });

      mockFs.readFileSync.mockReturnValue(alpsContent);

      const result = await handleAlps2Svg({ alps_path: '/path/to/alps.json' });

      expect(result.isError).toBe(false);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/alps.json', 'utf-8');
      expect(result.content[0].text).toContain('✅ SVG generated');
    });

    it('should return error when file cannot be read', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await handleAlps2Svg({ alps_path: '/invalid/path.json' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: Cannot read file');
    });

    it('should return error when both alps_content and alps_path are missing', async () => {
      const result = await handleAlps2Svg({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: alps_content or alps_path is required');
    });

    it('should return error when args is undefined', async () => {
      const result = await handleAlps2Svg(undefined);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: alps_content or alps_path is required');
    });

    it('should handle parse errors', async () => {
      const result = await handleAlps2Svg({ alps_content: 'invalid content' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should prefer alps_content over alps_path', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [{ id: 'test', type: 'semantic' }],
        },
      });

      const result = await handleAlps2Svg({
        alps_content: alpsContent,
        alps_path: '/should/not/be/used.json',
      });

      expect(result.isError).toBe(false);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe('handleAlps2Mermaid', () => {
    it('should generate Mermaid from alps_content', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [
            { id: 'Home', type: 'semantic' },
            { id: 'goHome', type: 'safe', rt: '#Home' },
          ],
        },
      });

      const result = await handleAlps2Mermaid({ alps_content: alpsContent });

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('✅ Mermaid classDiagram generated');
      expect(result.content[0].text).toContain('```mermaid');
      expect(result.content[0].text).toContain('classDiagram');
    });

    it('should read from alps_path when provided', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [{ id: 'test', type: 'semantic' }],
        },
      });

      mockFs.readFileSync.mockReturnValue(alpsContent);

      const result = await handleAlps2Mermaid({ alps_path: '/path/to/alps.json' });

      expect(result.isError).toBe(false);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/alps.json', 'utf-8');
      expect(result.content[0].text).toContain('✅ Mermaid classDiagram generated');
    });

    it('should return error when file cannot be read', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await handleAlps2Mermaid({ alps_path: '/invalid/path.json' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: Cannot read file');
    });

    it('should return error when both alps_content and alps_path are missing', async () => {
      const result = await handleAlps2Mermaid({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: alps_content or alps_path is required');
    });

    it('should return error when args is undefined', async () => {
      const result = await handleAlps2Mermaid(undefined);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: alps_content or alps_path is required');
    });

    it('should handle parse errors', async () => {
      const result = await handleAlps2Mermaid({ alps_content: 'invalid content' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should prefer alps_content over alps_path', async () => {
      const alpsContent = JSON.stringify({
        alps: {
          descriptor: [{ id: 'test', type: 'semantic' }],
        },
      });

      const result = await handleAlps2Mermaid({
        alps_content: alpsContent,
        alps_path: '/should/not/be/used.json',
      });

      expect(result.isError).toBe(false);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe('handleAlpsGuide', () => {
    it('should return guide content', () => {
      const result = handleAlpsGuide();

      expect(result.isError).toBe(false);
      expect(result.content[0].text).toBeTruthy();
      expect(result.content[0].text.length).toBeGreaterThan(100);
    });

    it('should contain key ALPS concepts', () => {
      const result = handleAlpsGuide();
      const guideText = result.content[0].text.toLowerCase();

      const expectedConcepts = [
        'safe',
        'unsafe',
        'idempotent',
        'ontology',
        'taxonomy',
        'choreography',
      ];

      for (const concept of expectedConcepts) {
        expect(guideText).toContain(concept);
      }
    });
  });

  describe('handleCrawlAndExtract', () => {
    it('should return not-implemented error', async () => {
      const result = await handleCrawlAndExtract({ url: 'https://example.com' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not yet fully implemented');
    });

    it('should return error when url is missing', async () => {
      const result = await handleCrawlAndExtract({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: url is required');
    });

    it('should return error when args is undefined', async () => {
      const result = await handleCrawlAndExtract(undefined);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: url is required');
    });

    it('should accept optional parameters', async () => {
      const result = await handleCrawlAndExtract({
        url: 'https://example.com',
        max_depth: 5,
        exclude_patterns: ['*/admin/*', '*/login'],
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not yet fully implemented');
    });
  });

  describe('getEmbeddedGuide', () => {
    it('should return embedded guide string', () => {
      const guide = getEmbeddedGuide();

      expect(typeof guide).toBe('string');
      expect(guide.length).toBeGreaterThan(100);
    });

    it('should contain ALPS best practices', () => {
      const guide = getEmbeddedGuide();

      expect(guide).toContain('ALPS Best Practices');
      expect(guide).toContain('Naming Conventions');
      expect(guide).toContain('Three Layers');
    });

    it('should contain naming convention examples', () => {
      const guide = getEmbeddedGuide();

      expect(guide).toContain('goProductList');
      expect(guide).toContain('doCreateUser');
      expect(guide).toContain('HomePage');
    });
  });
});
