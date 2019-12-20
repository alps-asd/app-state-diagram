<?php

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
        $this->alpsScanner = new AlpsScanner;
    }

    public function test()
    {
       ($this->alpsScanner)(__DIR__ . '/Fake/alps.json');
       $this->assertSame($this->alpsScanner->links['Foo->Bar'], 'index (safe)');
    }
}
