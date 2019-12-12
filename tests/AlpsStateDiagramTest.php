<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AlpsStateDiagram\Exception\InvaliDirPathException;
use PHPUnit\Framework\TestCase;

class AlpsStateDiagramTest extends TestCase
{
    /**
     * @var AlpsStateDiagram
     */
    protected $alpsStateDiagram;

    protected function setUp() : void
    {
        $this->alpsStateDiagram = new AlpsStateDiagram;
    }

    public function testIsInstanceOfAlpsStateDiagram() : void
    {
        $actual = $this->alpsStateDiagram;
        $this->assertInstanceOf(AlpsStateDiagram::class, $actual);
    }

    public function testFileNotReadable() : void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        $this->alpsStateDiagram->setFile('__INVALID__');
    }

    public function tesSetFile() : void
    {
        $this->alpsStateDiagram->setFile(__DIR__ . '/Fake/alps.json');
        $dot = $this->alpsStateDiagram->toString();
        $this->assertStringContainsString('Index->Blog [label = "blog (safe)"];', $dot);
        $this->assertStringContainsString('Blog->BlogPosting [label = "blogPosting (safe), item (safe)"];', $dot);
        $this->assertStringContainsString('Blog->Blog [label = "post (unsafe)"];', $dot);
        $this->assertStringContainsString('Blog->About [label = "about (safe)"];', $dot);
        $this->assertStringContainsString('BlogPosting->Blog [label = "collection (safe)"];', $dot);
        $this->assertStringContainsString('Blog->About', $dot);
        file_put_contents(__DIR__ . '/alps.dot', $dot);
    }

    public function testScanDirInvalidPath() : void
    {
        $this->expectException(InvaliDirPathException::class);
        $this->alpsStateDiagram->setDir(__DIR__ . '/__INVALID__');
    }

    public function testSetDir() : void
    {
        $this->alpsStateDiagram->setDir(__DIR__ . '/Fake');
        $dot = $this->alpsStateDiagram->toString();
        $this->assertStringContainsString(' Foo->Bar [label = "bar (safe)"];', $dot);
    }
}
