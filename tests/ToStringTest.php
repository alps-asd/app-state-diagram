<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use PHPUnit\Framework\TestCase;

class ToStringTest extends TestCase
{
    private $toString;

    protected function setUp() : void
    {
        $this->toString = new ToString;
    }

    public function test__invoke() : void
    {
        $alps = [
            'Index->Blog' => 'blog (safe)'
        ];
        $dot = ($this->toString)($alps);
        $this->assertStringContainsString('Index->Blog [label = "blog (safe)"]', $dot);
    }
}
