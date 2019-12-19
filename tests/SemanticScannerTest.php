<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class SemanticScannerTest extends TestCase
{
    private $scanner;

    protected function setUp() : void
    {
        $this->scanner = new DescriptorScanner;
    }

    public function test__invoke() : void
    {
        $alps = json_decode((string) file_get_contents(__DIR__ . '/Fake/alps.json'));
        $semantics = ($this->scanner)($alps->alps->descriptor);
        $this->assertArrayHasKey('Index', $semantics);
        $this->assertArrayHasKey('About', $semantics);
        $this->assertArrayHasKey('Blog', $semantics);
        $this->assertArrayHasKey('BlogPosting', $semantics);
        $this->assertArrayHasKey('id', $semantics);
        $this->assertArrayHasKey('articleBody', $semantics);
        $this->assertArrayHasKey('dateCreated', $semantics);
    }
}
