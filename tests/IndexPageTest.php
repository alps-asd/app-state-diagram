<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class IndexPageTest extends TestCase
{
    public function testInvoke(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $html = (new IndexPage($this->getConfig($alpsFile)))->content;
        $this->assertStringContainsString('<a id="About"></a>', $html);

        return $html;
    }

    public function testInvokeMarkdownMode(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $content = (new IndexPage($this->getConfig($alpsFile, DumpDocs::MODE_MARKDOWN)))->content;
        $this->assertStringContainsString('<a id="About"></a>', $content);

        return $content;
    }

    /** @depends testInvoke */
    public function testLinkRelationsIsNotMissing(string $html): void
    {
        $this->assertStringContainsString('Links', $html);
    }

    public function testText(): void
    {
        $alpsFile = __DIR__ . '/Fake/project/min/profile.json';
        $html = (new IndexPage($this->getConfig($alpsFile)))->content;
        $this->assertStringContainsString('foo-title', $html);
        $this->assertStringContainsString('bar</a>', $html);
    }

    public function testLinkRelationsString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_single_link.json';
        $html = (new IndexPage($this->getConfig($alpsFile)))->content;
        $this->assertStringContainsString('<a rel="about" href="https://github.com/alps-asd/app-state-diagram/index.html">about</a>', $html);
    }

    public function testLinkRelationsStringMarkdownMode(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_single_link.json';
        $content = (new IndexPage($this->getConfig($alpsFile, DumpDocs::MODE_MARKDOWN)))->content;
        $this->assertStringContainsString('* <a rel="about" href="https://github.com/alps-asd/app-state-diagram/index.html">about</a>', $content);
    }

    public function testMultipleLinkRelationsString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_multiple_link.json';
        $html = (new IndexPage($this->getConfig($alpsFile)))->content;
        $this->assertStringContainsString('<a rel="about" href="https://github.com/alps-asd/app-state-diagram/">about</a>', $html);
        $this->assertStringContainsString('<a rel="repository" href="https://github.com/alps-asd/app-state-diagram/">repository</a>', $html);
    }

    public function testTitle(): void
    {
        $alpsFile = __DIR__ . '/Fake/title.json';
        $html = (new IndexPage($this->getConfig($alpsFile)))->content;
        $this->assertStringContainsString('<title>Title</title>', $html);
    }

    public function testTitleMarkdownMode(): void
    {
        $alpsFile = __DIR__ . '/Fake/title.json';
        $content = (new IndexPage($this->getConfig($alpsFile, DumpDocs::MODE_MARKDOWN)))->content;
        $this->assertStringContainsString('# Title', $content);
    }

    /** @depends testInvoke */
    public function testNoTitle(string $content): void
    {
        $this->assertStringContainsString('<title>ALPS</title>', $content);
    }

    /** @depends testInvokeMarkdownMode */
    public function testNoTitleMarkdownMode(string $content): void
    {
        $this->assertStringContainsString('# ALPS', $content);
    }

    private function getConfig(string $alpsFile, string $outputMode = DumpDocs::MODE_HTML): Config
    {
        return new Config($alpsFile, false, $outputMode);
    }
}
