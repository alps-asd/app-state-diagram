<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidHrefException;
use PHPUnit\Framework\TestCase;

class AsdRendererTest extends TestCase
{
    private $toString;

    protected function setUp() : void
    {
        $this->toString = new AsdRenderer;
    }

    public function test__invoke() : void
    {
        $links = [
            'Index->Blog' => 'blog (safe)'
        ];
        $dot = ($this->toString)($links, []);
        $this->assertStringContainsString('Index->Blog [label = "blog (safe)"]', $dot);
    }

    public function testInvalidHref() : void
    {
        $this->expectException(InvalidHrefException::class);
        $descriptor = new SemanticDescriptor(json_decode((string) file_get_contents(__DIR__ . '/Fake/invalid_href.json')));
        ($this->toString)([], [$descriptor]);
    }

    public function testBox() : void
    {
        $descriptor = new SemanticDescriptor(json_decode((string) file_get_contents(__DIR__ . '/Fake/BlogPosting.json')));
        $dot = ($this->toString)([], [$descriptor]);
        $this->assertStringContainsString('(articleBody)', $dot);
        $this->assertStringContainsString('(dateCreated)', $dot);
    }
}
