<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class IndexPageTest extends TestCase
{
    public function testInvoke(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName())))->index;
        $this->assertStringContainsString('<li><a href="docs/semantic.About.html">About</a> (semantic)</li>', $html);

        return $html;
    }

    /**
     * @depends testInvoke
     */
    public function testLinkRelationsIsMissing(string $html): void
    {
        $this->assertStringNotContainsString('Links', $html);
    }

    public function testTagString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName())))->index;
        $this->assertStringContainsString('<li><a href="docs/tag.a.html">a</a>', $html);
        $this->assertStringContainsString('<li><a href="docs/tag.b.html">b</a>', $html);
    }

    public function testText(): void
    {
        $alpsFile = __DIR__ . '/Fake/project/min/profile.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName())))->index;
        $this->assertStringContainsString('foo</a> (semantic), foo-title</li>', $html);
        $this->assertStringContainsString('bar</a> (semantic)', $html);
    }

    public function testLinkRelationsString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_single_link.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName())))->index;
        $this->assertStringContainsString('<li>rel: about <a rel="about" href="https://github.com/koriym/app-state-diagram/">https://github.com/koriym/app-state-diagram/</a></li>', $html);
    }

    public function testMultipleLinkRelationsString(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_has_multiple_link.json';
        $html = (new IndexPage(new Profile($alpsFile, new LabelName())))->index;
        $this->assertStringContainsString('<li>rel: about <a rel="about" href="https://github.com/koriym/app-state-diagram/">https://github.com/koriym/app-state-diagram/</a></li>', $html);
        $this->assertStringContainsString('<li>rel: repository <a rel="repository" href="https://github.com/koriym/app-state-diagram/">https://github.com/koriym/app-state-diagram/</a></li>', $html);
    }
}
