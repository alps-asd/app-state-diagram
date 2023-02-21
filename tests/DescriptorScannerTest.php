<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\DescriptorIsNotArrayException;
use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use PHPUnit\Framework\TestCase;

use function assert;
use function file_get_contents;
use function is_object;
use function json_decode;
use function property_exists;

use const JSON_THROW_ON_ERROR;

class DescriptorScannerTest extends TestCase
{
    private CreateDescriptor $scanner;

    protected function setUp(): void
    {
        $this->scanner = new CreateDescriptor();
    }

    public function testInvoke(): void
    {
        $alps = json_decode((string) file_get_contents(__DIR__ . '/Fake/alps.json'), null, 512, JSON_THROW_ON_ERROR);
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

    public function testInvalidDescriptor(): void
    {
        $alps = json_decode((string) file_get_contents(__DIR__ . '/Fake/invalid_missing_id.json'), null, 512, JSON_THROW_ON_ERROR);
        assert(is_object($alps));
        assert(property_exists($alps, 'alps'));
        $this->expectException(InvalidDescriptorException::class);
        ($this->scanner)($alps->alps->descriptor);
    }

    public function testInlineDescriptorIsNotArray(): void
    {
        $alps = json_decode((string) file_get_contents(__DIR__ . '/Fake/invalid_descriptor_array.json'), null, 512, JSON_THROW_ON_ERROR);
        assert(is_object($alps));
        assert(property_exists($alps, 'alps'));
        $this->expectException(DescriptorIsNotArrayException::class);
        ($this->scanner)($alps->alps->descriptor);
    }
}
