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
        $svgFile = __DIR__ . '/Fake/config/profile.svg';
        @unlink($svgFile);
        ($this->putDiagram)(ConfigFactory::fromFile(__DIR__ . '/Fake/config/asd.xml'));
        $this->assertFileExists($svgFile);
    }
}
