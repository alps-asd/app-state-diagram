<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class AlpsProfileTest extends TestCase
{
    /** @var AlpsProfile */
    protected $profile;

    protected function setUp(): void
    {
        $this->profile = new AlpsProfile(__DIR__ . '/Fake/alps.json');
    }

    public function testProfile(): void
    {
        $this->assertSame('bar (safe)', (string) $this->profile->links['Foo->Bar']);
    }
}
