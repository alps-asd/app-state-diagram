<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class AlpsScannerTest extends TestCase
{
    /**
     * @var AlpsScanner
     */
    protected $alpsScanner;

    protected function setUp() : void
    {
        $this->alpsScanner = new AlpsScanner(__DIR__ . '/Fake/alps.json');
    }

    public function test() : void
    {
        $this->assertSame('bar (safe)', (string) $this->alpsScanner->links['Foo->Bar']);
    }
}
