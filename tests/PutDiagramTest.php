<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function file_exists;
use function ob_get_clean;
use function ob_start;
use function unlink;

final class PutDiagramTest extends TestCase
{
    public function testPutDiagramMarkdownMode(): void
    {
        $config = new Config(__DIR__ . '/Fake/min.json', false, DumpDocs::MODE_MARKDOWN);
        $putDiagram = new PutDiagram();

        // Capture output
        ob_start();
        $putDiagram($config);
        $output = ob_get_clean();
        $this->assertIsString($output);

        // Verify output contains expected messages
        $this->assertStringContainsString('ASD generated.', $output);
        $this->assertStringContainsString('Descriptors(', $output);

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

        // Capture output
        ob_start();
        $putDiagram($config);
        $output = ob_get_clean();
        $this->assertIsString($output);

        // Verify output contains expected messages
        $this->assertStringContainsString('ASD generated.', $output);
        $this->assertStringContainsString('Descriptors(', $output);

        // Verify HTML file was created
        $expectedHtmlFile = __DIR__ . '/Fake/index.html';
        $this->assertFileExists($expectedHtmlFile);

        // Clean up
        if (file_exists($expectedHtmlFile)) {
            unlink($expectedHtmlFile);
        }
    }
}
