<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use PHPUnit\Framework\TestCase;

class AlpsProfileTest extends TestCase
{
    /** @var AlpsProfile */
    protected $profile;

    protected function setUp(): void
    {
        $this->profile = new AlpsProfile(__DIR__ . '/Fake/alps.json');
    }

    public function testProfile(): void
    {
        $this->assertSame('bar (safe)', (string) $this->profile->links['Foo->Bar:bar']);
    }

    public function testFileNotReadable(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new AlpsProfile('__INVALID__');
    }

    public function testInvalidExternalFile(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new AlpsProfile(__DIR__ . '/Fake/alps.invalid_href_file.json');
    }

    public function testInvalidExternalDescriptor(): void
    {
        $this->expectException(DescriptorNotFoundException::class);
        new AlpsProfile(__DIR__ . '/Fake/alps.invalid_href_desc.json');
    }
}
