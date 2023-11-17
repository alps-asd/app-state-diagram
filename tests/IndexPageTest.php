<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class IndexPageTest extends TestCase
{
    public function testInvoke(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName()), ''))->content;
        $this->assertStringContainsString('<a name="About">About</a>', $html);

        return $html;
    }

    public function testInvokeMarkdownMode(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $content = (new IndexPage(new Profile($alpsFile, new LabelName()), DumpDocs::MODE_MARKDOWN))->content;
        $this->assertStringContainsString('<a name="About">About</a>', $content);

        return $content;
    }

    /** @depends testInvoke */
    public function testLinkRelationsIsMissing(string $html): void
    {
        $this->assertStringNotContainsString('Links', $html);
    }

    public function testTagString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName())))->content;
        $this->assertStringContainsString('<li><a href="docs/tag.a.html">a</a>', $html);
        $this->assertStringContainsString('<li><a href="docs/tag.b.html">b</a>', $html);
    }

    public function testTagStringMarkdownMode(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $content = (new IndexPage(new Profile($alpsFile, new LabelName()), DumpDocs::MODE_MARKDOWN))->content;
        $this->assertStringContainsString('[a](docs/tag.a.md)', $content);
        $this->assertStringContainsString('[b](docs/tag.b.md)', $content);
    }

    public function testText(): void
    {
        $alpsFile = __DIR__ . '/Fake/project/min/profile.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName()), ''))->content;
        $this->assertStringContainsString('foo</a> (semantic), foo-title</li>', $html);
        $this->assertStringContainsString('bar</a> (semantic)', $html);
    }

    public function testLinkRelationsString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_single_link.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName()), ''))->content;
        $this->assertStringContainsString('<li>rel: about <a rel="about" href="https://github.com/alps-asd/app-state-diagram/index.html">https://github.com/alps-asd/app-state-diagram/index.html</a></li>', $html);
    }

    public function testLinkRelationsStringMarkdownMode(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_single_link.json';
        $md = (new IndexPage(new Profile($alpsFile, new LabelName()), '',DumpDocs::MODE_MARKDOWN))->content;
        $this->assertStringContainsString('* rel: about <a rel="about" href="https://github.com/alps-asd/app-state-diagram/index.html">https://github.com/alps-asd/app-state-diagram/index.html</a>', $md);
    }

    public function testMultipleLinkRelationsString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_multiple_link.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName()), ''))->content;
        $this->assertStringContainsString('<li>rel: about <a rel="about" href="https://github.com/alps-asd/app-state-diagram/">https://github.com/alps-asd/app-state-diagram/</a></li>', $html);
        $this->assertStringContainsString('<li>rel: repository <a rel="repository" href="https://github.com/alps-asd/app-state-diagram/">https://github.com/alps-asd/app-state-diagram/</a></li>', $html);
    }

    public function testTitle(): void
    {
        $alpsFile = __DIR__ . '/Fake/title.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName()),''))->content;

        $this->assertStringContainsString('<title>Title</title>', $html);
    }

    public function testTitleMarkdownMode(): void
    {
        $alpsFile = __DIR__ . '/Fake/title.json';
        $content = (new IndexPage(new Profile($alpsFile, new LabelName()), '', DumpDocs::MODE_MARKDOWN))->content;

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
}
