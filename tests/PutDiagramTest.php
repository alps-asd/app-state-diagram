<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function file_exists;
use function file_get_contents;
use function unlink;

final class PutDiagramTest extends TestCase
{
    public function testPutDiagramMarkdownMode(): void
    {
        $config = new Config(__DIR__ . '/Fake/min.json', false, DumpDocs::MODE_MARKDOWN);
        $putDiagram = new PutDiagram();

        $putDiagram($config);

        // Verify markdown file was created
        $expectedMdFile = __DIR__ . '/Fake/index.md';
        $this->assertFileExists($expectedMdFile);

        // Verify HTML file was also created in markdown mode
        $expectedHtmlFile = __DIR__ . '/Fake/index.html';
        $this->assertFileExists($expectedHtmlFile);

        // Clean up
        if (file_exists($expectedMdFile)) {
            unlink($expectedMdFile);
        }

        if (file_exists($expectedHtmlFile)) {
            unlink($expectedHtmlFile);
        }
    }

    public function testPutDiagramHtmlMode(): void
    {
        $config = new Config(__DIR__ . '/Fake/min.json', false, DumpDocs::MODE_HTML);
        $putDiagram = new PutDiagram();

        $putDiagram($config);

        // Verify HTML file was created
        $expectedHtmlFile = __DIR__ . '/Fake/index.html';
        $this->assertFileExists($expectedHtmlFile);

        // Clean up
        if (file_exists($expectedHtmlFile)) {
            unlink($expectedHtmlFile);
        }
    }

    public function testPutDiagramSvgMode(): void
    {
        $config = new Config(__DIR__ . '/Fake/min.json', false, DumpDocs::MODE_SVG);
        $putDiagram = new PutDiagram();

        $putDiagram($config);

        // Verify SVG files were created
        $expectedSvgFile = __DIR__ . '/Fake/min.svg';
        $expectedTitleSvgFile = __DIR__ . '/Fake/min.title.svg';
        $this->assertFileExists($expectedSvgFile);
        $this->assertFileExists($expectedTitleSvgFile);

        // Verify SVG content is valid
        $svgContent = file_get_contents($expectedSvgFile);
        $this->assertStringContainsString('<svg', $svgContent);
        $this->assertStringContainsString('</svg>', $svgContent);

        $titleSvgContent = file_get_contents($expectedTitleSvgFile);
        $this->assertStringContainsString('<svg', $titleSvgContent);
        $this->assertStringContainsString('</svg>', $titleSvgContent);

        // Clean up
        if (file_exists($expectedSvgFile)) {
            unlink($expectedSvgFile);
        }

        if (file_exists($expectedTitleSvgFile)) {
            unlink($expectedTitleSvgFile);
        }
    }
}
