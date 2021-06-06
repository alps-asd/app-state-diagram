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
        $profile = new Profile($alpsFile);
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
        $profile = new Profile($alpsFile);
        (new DumpDocs())($profile, $alpsFile);

        $this->assertFileExists(__DIR__ . '/Fake/docs/tag.a.html');
        $this->assertFileExists(__DIR__ . '/Fake/docs/tag.b.html');
    }
}
