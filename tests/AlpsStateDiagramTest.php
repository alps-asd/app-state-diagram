<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use PHPUnit\Framework\TestCase;

class AlpsStateDiagramTest extends TestCase
{
    /**
     * @var AlpsStateDiagram
     */
    protected $alpsStateDiagram;

    protected function setUp() : void
    {
        $this->alpsStateDiagram = new AlpsStateDiagram;
    }

    public function testIsInstanceOfAlpsStateDiagram() : void
    {
        $actual = $this->alpsStateDiagram;
        $this->assertInstanceOf(AlpsStateDiagram::class, $actual);
    }
}
