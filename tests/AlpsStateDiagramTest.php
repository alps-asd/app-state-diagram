<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use PHPUnit\Framework\TestCase;

use function file_put_contents;
use function substr_count;

class AlpsStateDiagramTest extends TestCase
{
    public function testIsInstanceOfAlpsStateDiagram(): AppStateDiagram
    {
        $alpsStateDiagram = new AppStateDiagram(__DIR__ . '/Fake/alps.json');
        $actual = $alpsStateDiagram;
        $this->assertInstanceOf(AppStateDiagram::class, $actual);

        return $alpsStateDiagram;
    }

    public function testFileNotReadable(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new AppStateDiagram('__INVALID__');
    }

    /**
     * @depends testIsInstanceOfAlpsStateDiagram
     */
    public function testInvoke(AppStateDiagram $alpsStateDiagram): string
    {
        $dot = $alpsStateDiagram->getDot();
        $this->assertStringContainsString('Index->Blog [label = "blog (safe)"', $dot);
        $this->assertStringContainsString('Blog->BlogPosting [label = "blogPosting, item (safe)"', $dot);
        $this->assertStringContainsString('Blog->Blog [label = "post (unsafe)"', $dot);
        $this->assertStringContainsString('Blog->About [label = "about (safe)"', $dot);
        $this->assertStringContainsString('BlogPosting->Blog [label = "blog, colletion (safe)"', $dot);
        $this->assertStringContainsString('Blog->About', $dot);
        file_put_contents(__DIR__ . '/alps.dot', $dot);

        return $dot;
    }

    /**
     * @depends testInvoke
     */
    public function testIncludeFile(string $dot): void
    {
        $this->assertStringContainsString('Foo->Bar', $dot);
    }

    public function testInvalidExternalFile(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new AppStateDiagram(__DIR__ . '/Fake/alps.invalid_href_file.json');
    }

    public function testInvalidExternalDescriptor(): void
    {
        $this->expectException(DescriptorNotFoundException::class);
        new AppStateDiagram(__DIR__ . '/Fake/alps.invalid_href_desc.json');
    }

    /**
     * @depends testInvoke
     */
    public function testExternalHref(string $dot): void
    {
        $this->assertStringContainsString('Blog->Baz', $dot);
    }

    public function testMultipleLink(): void
    {
        $alpsFile = __DIR__ . '/Fake/multiple_link/multiple_link.json';
        $asd = new AppStateDiagram($alpsFile);
        $dot = $asd->getDot();
        $numberOfArrow = substr_count($dot, 'Index->Foo');
        $this->assertSame(3, $numberOfArrow);
    }
}
