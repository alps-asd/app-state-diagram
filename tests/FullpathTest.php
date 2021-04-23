<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class FullpathTest extends TestCase
{
    /** @var Fullpath */
    private $fullPath;

    public function setUp(): void
    {
        $this->fullPath = new Fullpath();
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

    public function testFileRelativePath(): void
    {
        $path = ($this->fullPath)('/path/to/alpsFile', 'bar.json#bar');
        $this->assertSame('/path/to/bar.json#bar', $path);
    }

    public function testHttp(): void
    {
        $path = ($this->fullPath)('', 'http://example.com#foo');
        $this->assertSame('http://example.com#foo', $path);
    }

    public function testHttpRelativePath(): void
    {
        $path = ($this->fullPath)('http://example.com/foo.json', 'bar.json#bar');
        $this->assertSame('http://example.com/bar.json#bar', $path);
    }
}
