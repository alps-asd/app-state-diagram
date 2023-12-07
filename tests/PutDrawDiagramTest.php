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

    public function testInvokeMdWithHtml(): void
    {
        $mdFile = __DIR__ . '/Fake/config/index.md';
        $htmlFile = __DIR__ . '/Fake/config/index.html';
        @unlink($mdFile);
        @unlink($htmlFile);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.xml'));
        $this->assertFileExists($mdFile);
        $this->assertFileExists($htmlFile);
    }

    public function testInvokeHtml(): void
    {
        $file = __DIR__ . '/Fake/config/index.html';
        @unlink($file);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.html.xml'));
        $this->assertFileExists($file);
    }
}
