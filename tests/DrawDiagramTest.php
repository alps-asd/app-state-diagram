<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use PHPUnit\Framework\TestCase;

use function substr_count;

class DrawDiagramTest extends TestCase
{
    /** @var DrawDiagram */
    private $drawDiagram;

    protected function setUp(): void
    {
        $this->drawDiagram = new DrawDiagram();
    }

    public function testInvoke(): string
    {
        $alps = new AlpsProfile(__DIR__ . '/Fake/alps.json');
        $dot = ($this->drawDiagram)($alps);
        $this->assertStringContainsString('Index -> Blog [label = "blog (safe)"', $dot);
        $this->assertStringContainsString('Blog -> BlogPosting [label = "blogPosting, item (safe)"', $dot);
        $this->assertStringContainsString('Blog -> Blog [label = "post (unsafe)"', $dot);
        $this->assertStringContainsString('Blog -> About [label = "about (safe)"', $dot);
        $this->assertStringContainsString('BlogPosting -> Blog [label = "blog, colletion (safe)"', $dot);
        $this->assertStringContainsString('Blog -> About', $dot);

        return $dot;
    }

    /**
     * @depends testInvoke
     */
    public function testExternalHref(string $dot): void
    {
        $this->assertStringContainsString('Blog -> Baz', $dot);
    }

    public function testMultipleLink(): void
    {
        $alpsFile = __DIR__ . '/Fake/multiple_link/multiple_link.json';
        $dot = ($this->drawDiagram)(new AlpsProfile($alpsFile));
        $numberOfArrow = substr_count($dot, 'Index -> Foo');
        $this->assertSame(1, $numberOfArrow);
    }

    public function testNoState(): void
    {
        $alpsFile = __DIR__ . '/Fake/no_state.json';
        $dot = ($this->drawDiagram)(new AlpsProfile($alpsFile));
        $this->assertStringNotContainsString('name [', $dot);
    }

    public function testTaggedProfile(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $taggedProfile = new TaggedAlpsProfile(
            new AlpsProfile($alpsFile),
            [],
            ['a', 'b']
        );
        $dot = ($this->drawDiagram)($taggedProfile);
        $this->assertStringContainsString('s1 -> s2 [label = "t1 (safe)"', $dot);
        $this->assertStringContainsString('s1 -> s5 [label = "t5 (safe)"', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = "t2 (safe)"', $dot);
        $this->assertStringNotContainsString('s2 -> s4 [label = "t4 (safe)"', $dot);
        $this->assertStringNotContainsString('s3 -> s4 [label = "t3 (safe)"', $dot);
        $this->assertStringNotContainsString('s5 -> s6 [label = "t6 (safe)"', $dot);
    }
}
