<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function file_put_contents;

class VocabularyTest extends TestCase
{
    public function testInvoke(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $scanner = new AlpsProfile(__DIR__ . '/Fake/alps.json');
        $html = (new Vocabulary($scanner->descriptors, $alpsFile))->index;
        $this->assertStringContainsString('<li><a href="docs/semantic.About.html">About</a> (semantic)</li>', $html);
    }
}
