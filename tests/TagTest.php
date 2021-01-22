<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use Koriym\AppStateDiagram\Exception\DescriptorNotFoundException;
use PHPUnit\Framework\TestCase;

class TagTest extends TestCase
{
    /** @var AlpsProfile */
    protected $profile;

    protected function setUp(): void
    {
        $this->profile = new AlpsProfile(__DIR__ . '/Fake/alps_tag.json');
    }

    public function testFilteredBtTag(): void
    {
        $profile = $this->profile;
        $this->assertArrayHasKey('s1->s2:t1', $profile->links);
        $this->assertArrayNotHasKey('s2->s3:t2', $profile->links);
    }
}
