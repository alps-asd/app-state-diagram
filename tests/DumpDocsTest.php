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
        $this->assertStringContainsString(/** @lang HTML */'<li>rel: help <a rel="help" href="https://github.com/koriym/app-state-diagram/">https://github.com/koriym/app-state-diagram/</a> API Help File</li>', $html);
        $this->assertStringContainsString(/** @lang HTML */'<li>rel: about <a rel="about" href="https://github.com/koriym/app-state-diagram/">https://github.com/koriym/app-state-diagram/</a></li>', $html);
    }
}
