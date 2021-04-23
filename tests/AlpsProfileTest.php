<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use PHPUnit\Framework\TestCase;

use function stream_wrapper_register;
use function stream_wrapper_restore;
use function stream_wrapper_unregister;

class AlpsProfileTest extends TestCase
{
    public function testProfile(): void
    {
        $profile = new AlpsProfile(__DIR__ . '/Fake/alps.json');
        $this->assertSame('bar (safe)', (string) $profile->links['Foo->Bar:bar']);
    }

    public function testIncludeExternalRemoteProfile(): void
    {
        $profile = new AlpsProfile(__DIR__ . '/Fake/alps.remote_profile.json');
        $this->assertSame('start (safe)', (string) $profile->links['Index->Blog:start']);
    }

    public function testReadRemoteProfile(): void
    {
        $profile = new AlpsProfile('https://raw.githubusercontent.com/koriym/app-state-diagram/master/docs/blog/profile.json');
        $this->assertSame('start (safe)', (string) $profile->links['Index->Blog:start']);
    }

    public function testReadPhpInput(): void
    {
        stream_wrapper_unregister('php');
        stream_wrapper_register('php', FakeAlpsJsonInputStreamWrapper::class);
        $profile = new AlpsProfile('php://input');
        $this->assertSame('start (safe)', (string) $profile->links['Index->Blog:start']);
        stream_wrapper_restore('php');
    }

    public function testExternalRt(): void
    {
        $profile = new AlpsProfile(__DIR__ . '/Fake/alps.rt_external.json');
        $this->assertSame('foo (safe)', (string) $profile->links['Index->Foo:foo']);
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
