<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class AlpsProfile extends TestCase
{
    /**
     * @var AlpsProfile
     */
    protected $alpsScanner;

    protected function setUp() : void
    {
        $this->alpsScanner = new AlpsProfile(__DIR__ . '/Fake/alps.json');
    }

    public function test() : void
    {
        $this->assertSame('bar (safe)', (string) $this->alpsScanner->links['Foo->Bar']);
    }
}
