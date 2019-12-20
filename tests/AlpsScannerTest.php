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
        $this->alpsScanner = new AlpsScanner;
    }

    public function test() : void
    {
        ($this->alpsScanner)(__DIR__ . '/Fake/alps.json');
        $this->assertSame('bar (safe)', (string) $this->alpsScanner->links['Foo->Bar']);
    }
}
