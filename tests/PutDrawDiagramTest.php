<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function dirname;
use function file_get_contents;
use function unlink;

class PutDrawDiagramTest extends TestCase
{
    /** @var PutDiagram */
    private $putDiagram;

    protected function setUp(): void
    {
        $this->putDiagram = new PutDiagram();
    }

    public function testInvoke(): void
    {
        $svgFile = __DIR__ . '/Fake/config/profile.svg';
        @unlink($svgFile);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.xml'));
        $this->assertFileExists($svgFile);
    }

    public function testInvokeHtml(): void
    {
        $svgFile = __DIR__ . '/Fake/config/profile.svg';
        @unlink($svgFile);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.html.xml'));
        $this->assertFileExists($svgFile);
    }

    /**
     * @depends testInvoke
     */
    public function testLinkId(): void
    {
        $profileDot = (string) file_get_contents(dirname(__DIR__) . '/tests/Fake/config/profile.dot');
        $this->assertStringContainsString('About -> Blog [label = <goBlog (safe)> URL="#goBlog"', $profileDot);
    }

    /** @depends testInvoke */
    public function testLinkTitle(): void
    {
        $profileTitleDot = (string) file_get_contents(dirname(__DIR__) . '/tests/Fake/config/profile.title.dot');
        $this->assertStringContainsString('About -> Blog [label = <to blog> URL="#goBlog"', $profileTitleDot);
    }
}
