<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

class TagTest extends TestCase
{
    /** @var TaggedAlpsProfile */
    protected $profile;

    protected function setUp(): void
    {
        $andTags = ['a', 'b'];
        $orTags = [];
        $this->profile = (
            new TaggedAlpsProfile(
                new AlpsProfile(__DIR__ . '/Fake/alps_tag.json'),
                $orTags,
                $andTags
            )
        );
    }

    public function testFilteredBtTag(): void
    {
        $profile = $this->profile;
        $this->assertArrayHasKey('s1->s2:t1', $profile->links);
        $this->assertArrayNotHasKey('s2->s3:t2', $profile->links);
    }
}
