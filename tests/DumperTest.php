<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class DumperTest extends TestCase
{
    /** @var Dumper */
    protected $dumper;

    protected function setUp(): void
    {
        $this->dumper = new Dumper();
    }

    public function testInvoke()
    {
        $alpsFile = __DIR__ . '/Fake/alps.json';
        $profile = new AlpsProfile($alpsFile);
        $this->dumper->__invoke($profile->descriptors, $alpsFile);
    }
}
