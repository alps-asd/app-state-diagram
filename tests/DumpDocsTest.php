<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function file_get_contents;

class DumpDocsTest extends TestCase
{
    public function testInvoke(): void
    {
        $alpsFile = __DIR__ . '/Fake/project/min/profile.json';
        $profile = new Profile($alpsFile, new LabelName());
        (new DumpDocs())($profile, $alpsFile);
        $this->assertFileExists(__DIR__ . '/Fake/project/min/docs/semantic.bar.html');
        $this->assertFileExists(__DIR__ . '/Fake/project/min/docs/semantic.foo.html');
    }

    /**
     * @depends testInvoke
     */
    public function testSemanticPageContainTitle(): void
    {
        $html = (string) file_get_contents(__DIR__ . '/Fake/project/min/docs/semantic.foo.html');

        $this->assertStringContainsString('type: semantic', $html);
        $this->assertStringContainsString('title: foo-title', $html);
    }

    /**
     * @depends testInvoke
     */
    public function testSemanticPageTableContainTitle(): void
    {
        $html = (string) file_get_contents(__DIR__ . '/Fake/project/min/docs/semantic.bar.html');

        $this->assertStringContainsString(/** @lang HTML */'<th>title</th>', $html);
        $this->assertStringContainsString(/** @lang HTML */'<td>baz-title</td>', $html);
        $this->assertStringContainsString(/** @lang HTML */'<td>override foo-title</td>', $html);
    }

    /** @depends testInvoke */
    public function testSemanticPageContainsHref(): void
    {
        $html = (string) file_get_contents(__DIR__ . '/Fake/project/min/docs/semantic.override-foo.html');

        $this->assertStringContainsString('<li>href: <a href="semantic.foo.html">foo</a></li>', $html);
    }

    public function testTagDoc(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $profile = new Profile($alpsFile, new LabelName());
        (new DumpDocs())($profile, $alpsFile);

        $this->assertFileExists(__DIR__ . '/Fake/docs/tag.a.html');
        $this->assertFileExists(__DIR__ . '/Fake/docs/tag.b.html');
    }

    public function testRelations(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_multiple_link.json';
        $profile = new Profile($alpsFile, new LabelName());
        (new DumpDocs())($profile, $alpsFile);
        $html = (string) file_get_contents(__DIR__ . '/Fake/docs/semantic.Item.html');

        $this->assertStringContainsString(/** @lang HTML */'<li>links', $html);
        $this->assertStringContainsString(/** @lang HTML */'<li>rel: help <a rel="help" href="https://github.com/alps-asd/app-state-diagram/">https://github.com/alps-asd/app-state-diagram/</a> API Help File</li>', $html);
        $this->assertStringContainsString(/** @lang HTML */'<li>rel: about <a rel="about" href="https://github.com/alps-asd/app-state-diagram/">https://github.com/alps-asd/app-state-diagram/</a></li>', $html);
    }

    public function testMarkdown(): void
    {
        $alpsFile = __DIR__ . '/Fake/project/min/profile.json';
        $profile = new Profile($alpsFile, new LabelName());
        (new DumpDocs())($profile, $alpsFile, DumpDocs::MODE_MARKDOWN);
        $this->assertFileExists(__DIR__ . '/Fake/project/min/docs/semantic.bar.md');
        $this->assertFileExists(__DIR__ . '/Fake/project/min/docs/semantic.foo.md');
    }

    /** @depends testMarkdown */
    public function testSemanticPageFooterLinkMarkdownMode(): void
    {
        $md = (string) file_get_contents(__DIR__ . '/Fake/project/min/docs/semantic.bar.md');

        $this->assertStringContainsString(
            '[home](../index.md) | [asd](../profile.svg)',
            $md
        );
    }

    /** @depends testMarkdown */
    public function testTagPageFooterLinkMarkdownMode(): void
    {
        $md = (string) file_get_contents(__DIR__ . '/Fake/project/min/docs/tag.foo.md');

        $this->assertStringContainsString(
            '[home](../index.md) | [asd](../profile.svg) | foo',
            $md
        );
    }

    /** @depends testMarkdown */
    public function testLinkRelationsStringMarkdownMode(): void
    {
        $md = (string) file_get_contents(__DIR__ . '/Fake/project/min/docs/semantic.bar.md');

        $this->assertStringContainsString(
            '* rel: about <a rel="about" href="https://github.com/alps-asd/app-state-diagram/index.html">https://github.com/alps-asd/app-state-diagram/index.html</a>',
            $md
        );
    }
}
