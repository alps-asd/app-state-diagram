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
    public function testMinProfile(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/min.json');
        $this->assertArrayHasKey('min', $profile->descriptors);
    }

    public function testFakeProfile()
    {
        $profile = new Profile(__DIR__ . '/Fake/fake.json');
        $this->assertCount(15, $profile->descriptors);
        $this->assertCount(3, $profile->links);
    }

    public function testProfile(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/alps.json');
        $this->assertSame('goBar (safe)', (string) $profile->links['Foo->Bar:goBar']);
    }

    public function testIncludeExternalRemoteProfile(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/remote_link.json');
        $this->assertArrayHasKey('About->Blog:backToBlog', $profile->links);
        $this->assertArrayHasKey('Blog->About:about', $profile->links);
        $this->assertArrayHasKey('Blog->Blog:post', $profile->links);
        $this->assertArrayHasKey('Blog->About:about', $profile->links);
        $this->assertArrayHasKey('Blog->BlogPosting:blogPosting', $profile->links);
        $this->assertArrayHasKey('BlogPosting->Blog:blog', $profile->links);
    }

    public function testHttpProfile(): void
    {
        $profile = new Profile('https://raw.githubusercontent.com/koriym/app-state-diagram/master/docs/blog/profile.json');
        $this->assertSame('start (safe)', (string) $profile->links['Index->Blog:start']);
    }

    public function testReadPhpInput(): void
    {
        stream_wrapper_unregister('php');
        stream_wrapper_register('php', FakeAlpsJsonInputStreamWrapper::class);
        $profile = new Profile('php://input');
        $this->assertSame('about (safe)', (string) $profile->links['Blog->About:about']);
        stream_wrapper_restore('php');
    }

    public function testExternalRt(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/alps.rt_external.json');
        $this->assertSame('foo (safe)', (string) $profile->links['Index->Foo:foo']);
    }

    public function testFileNotReadable(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new Profile('__INVALID__');
    }

    public function testInvalidExternalFile(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new Profile(__DIR__ . '/Fake/alps.invalid_href_file.json');
    }

    public function testInvalidExternalDescriptor(): void
    {
        $this->expectException(DescriptorNotFoundException::class);
        new Profile(__DIR__ . '/Fake/alps.invalid_href_desc.json');
    }
}
