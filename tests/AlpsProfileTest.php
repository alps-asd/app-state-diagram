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
        $profile = new Profile(__DIR__ . '/Fake/min.json', new LabelName());
        $this->assertArrayHasKey('min', $profile->descriptors);
    }

    public function testFakeProfile(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/fake.json', new LabelName());
        $this->assertCount(15, $profile->descriptors);
        $this->assertCount(3, $profile->links);
    }

    public function testProfile(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/alps.json', new LabelName());
        $this->assertSame('goBar (safe)', (string) $profile->links['Foo->Bar:goBar']);
    }

    public function testIncludeExternalRemoteProfile(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/remote_link.json', new LabelName());
        $this->assertArrayHasKey('About->Blog:goBlog', $profile->links);
        $this->assertArrayHasKey('Blog->About:goAbout', $profile->links);
        $this->assertArrayHasKey('Blog->Blog:doPost', $profile->links);
        $this->assertArrayHasKey('Blog->About:goAbout', $profile->links);
        $this->assertArrayHasKey('Blog->BlogPosting:goBlogPosting', $profile->links);
        $this->assertArrayHasKey('BlogPosting->Blog:goBlog', $profile->links);
    }

    public function testHttpProfile(): void
    {
        $profile = new Profile('https://raw.githubusercontent.com/koriym/app-state-diagram/master/docs/blog/profile.json', new LabelName());
        $this->assertSame('goBlog, collection (safe)', (string) $profile->links['Index->Blog:goBlog']);
    }

    public function testReadPhpInput(): void
    {
        stream_wrapper_unregister('php');
        stream_wrapper_register('php', FakeAlpsJsonInputStreamWrapper::class);
        $profile = new Profile('php://input', new LabelName());
        $this->assertSame('goAbout, about (safe)', (string) $profile->links['Blog->About:goAbout']);
        stream_wrapper_restore('php');
    }

    public function testExternalRt(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/alps.rt_external.json', new LabelName());
        $this->assertSame('foo (safe)', (string) $profile->links['Index->Foo:foo']);
    }

    public function testFileNotReadable(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new Profile('__INVALID__', new LabelName());
    }

    public function testInvalidExternalFile(): void
    {
        $this->expectException(AlpsFileNotReadableException::class);
        new Profile(__DIR__ . '/Fake/alps.invalid_href_file.json', new LabelName());
    }

    public function testInvalidExternalDescriptor(): void
    {
        $this->expectException(DescriptorNotFoundException::class);
        new Profile(__DIR__ . '/Fake/alps.invalid_href_desc.json', new LabelName());
    }
}
