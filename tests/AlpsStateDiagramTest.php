<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use PHPUnit\Framework\TestCase;

class AlpsStateDiagramTest extends TestCase
{
    /**
     * @var AppStateDiagram
     */
    protected $alpsStateDiagram;

    protected function setUp() : void
    {
        $this->alpsStateDiagram = new AppStateDiagram(__DIR__ . '/Fake/alps.json');
    }

    public function testIsInstanceOfAlpsStateDiagram() : void
    {
        $actual = $this->alpsStateDiagram;
        $this->assertInstanceOf(AppStateDiagram::class, $actual);
    }

    public function testFileNotReadable() : void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new AppStateDiagram('__INVALID__');
    }

    public function test__invoke() : string
    {
        $dot = $this->alpsStateDiagram->getDot();
        $this->assertStringContainsString('Index->Blog [label = "blog (safe)"];', $dot);
        $this->assertStringContainsString('Blog->BlogPosting [label = "blogPosting (safe), item (safe)"];', $dot);
        $this->assertStringContainsString('Blog->Blog [label = "post (unsafe)"];', $dot);
        $this->assertStringContainsString('Blog->About [label = "about (safe)"];', $dot);
        $this->assertStringContainsString('BlogPosting->Blog [label = "collection (safe)"];', $dot);
        $this->assertStringContainsString('Blog->About', $dot);
        file_put_contents(__DIR__ . '/alps.dot', $dot);

        return $dot;
    }

    /**
     * @depends test__invoke
     */
    public function testIncludeFile(string $dot) : void
    {
        $this->assertStringContainsString('Foo->Bar', $dot);
    }

    public function testInvalidExternalFile() : void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new AppStateDiagram(__DIR__ . '/Fake/alps.invalid_href_file.json');
    }

    public function testInvalidExternalDescriptor() : void
    {
        $this->expectException(DescriptorNotFoundException::class);
        new AppStateDiagram(__DIR__ . '/Fake/alps.invalid_href_desc.json');
    }

    /**
     * @depends test__invoke
     */
    public function testExternalHref(string $dot) : void
    {
        $this->assertStringContainsString('Blog->Baz', $dot);
    }
}
