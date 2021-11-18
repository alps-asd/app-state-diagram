<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function assert;
use function file_get_contents;
use function is_object;
use function json_decode;
use function property_exists;

class DescriptorScannerTest extends TestCase
{
    /** @var CreateDescriptor */
    private $scanner;

    protected function setUp(): void
    {
        $this->scanner = new CreateDescriptor();
    }

    public function testInvoke(): void
    {
        $alps = json_decode((string) file_get_contents(__DIR__ . '/Fake/alps.json'));
        assert(is_object($alps));
        assert(property_exists($alps, 'alps'));
        $semantics = ($this->scanner)($alps->alps->descriptor);
        $this->assertArrayHasKey('Index', $semantics);
        $this->assertArrayHasKey('About', $semantics);
        $this->assertArrayHasKey('Blog', $semantics);
        $this->assertArrayHasKey('BlogPosting', $semantics);
        $this->assertArrayHasKey('id', $semantics);
        $this->assertArrayHasKey('articleBody', $semantics);
        $this->assertArrayHasKey('dateCreated', $semantics);
    }

//    public function testExternalFile(): void
//    {
//        $alps = json_decode((string) file_get_contents(__DIR__ . '/Fake/min.json'));
//        $semantics = ($this->scanner)($alps->alps->descriptor);
//        $this->assertArrayHasKey('dateCreated', $semantics);
//    }
}
