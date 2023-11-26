<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

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
        $file = __DIR__ . '/Fake/config/index.md';
        @unlink($file);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.xml'));
        $this->assertFileExists($file);
    }

    public function testInvokeHtml(): void
    {
        $file = __DIR__ . '/Fake/config/index.html';
        @unlink($file);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.html.xml'));
        $this->assertFileExists($file);
    }
}
