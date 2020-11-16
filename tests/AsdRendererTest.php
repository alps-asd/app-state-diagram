<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidHrefException;
use PHPUnit\Framework\TestCase;

use function file_get_contents;
use function json_decode;

class AsdRendererTest extends TestCase
{
    /** @var AsdRenderer */
    private $renderer;

    protected function setUp(): void
    {
        $this->renderer = new AsdRenderer();
    }

    public function testInvoke(): void
    {
        $alps = new AlpsProfile(__DIR__ . '/Fake/alps.json');
        $dot = ($this->renderer)($alps->links, $alps->descriptors);
        $this->assertStringContainsString('Index -> Blog [label = "blog (safe)"', $dot);
    }

    public function testInvalidHref(): void
    {
        $this->expectException(InvalidHrefException::class);
        $descriptor = new SemanticDescriptor(json_decode((string) file_get_contents(__DIR__ . '/Fake/invalid_href.json')));
        ($this->renderer)([], [$descriptor]);
    }

    public function testBox(): void
    {
        $descriptor = new SemanticDescriptor(json_decode((string) file_get_contents(__DIR__ . '/Fake/BlogPosting.json')));
        $dot = ($this->renderer)([], [$descriptor]);
        $this->assertStringContainsString('(articleBody)', $dot);
        $this->assertStringContainsString('(dateCreated)', $dot);
    }
}
