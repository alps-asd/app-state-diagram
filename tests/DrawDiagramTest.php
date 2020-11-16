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
        $this->assertStringNotContainsString('name [style=solid', $dot);
    }
}
