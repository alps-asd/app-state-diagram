<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use PHPUnit\Framework\TestCase;

class FullpathTest extends TestCase
{
    /** @var FullPath */
    private $fullPath;

    public function setUp(): void
    {
        $this->fullPath = new FullPath();
    }

    public function testSharpBegin(): void
    {
        $path = ($this->fullPath)('/path/to/alpsFile', '#foo');
        $this->assertSame('/path/to/alpsFile#foo', $path);
    }

    public function testFullPath(): void
    {
        $href = __DIR__ . '/Fake/alps.json#Index';
        $path = ($this->fullPath)('/path/to/alpsFile', $href);
        $this->assertSame($href, $path);
    }

    public function testHttp(): void
    {
        $path = ($this->fullPath)('', 'http://example.com#foo');
        $this->assertSame('http://example.com#foo', $path);
    }

    public function testHrefIsExists(): void
    {
        $href = __DIR__ . '/Fake/alps.json';
        $path = ($this->fullPath)('/foo/profile.json', $href);

        $this->assertSame($href, $path);
    }

    public function testHrefIsNotExists(): void
    {
        $path = ($this->fullPath)('/foo/profile.json', 'Foo.json#id');
        $this->assertSame('/foo/Foo.json#id', $path);
    }

    public function testException(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        ($this->fullPath)('', 'Foo.json');
    }
}
