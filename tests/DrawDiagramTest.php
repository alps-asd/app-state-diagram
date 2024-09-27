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
        $profile = new Profile(__DIR__ . '/Fake/fake.json', new LabelName());
        $dot = ($this->drawDiagram)($profile, new LabelName());
        $this->assertStringContainsString('State1 -> State2 [label = <goState2 (safe)>', $dot);
        $this->assertStringContainsString('State2 -> State3 [label = <goState3 (safe)>', $dot);

        return $dot;
    }

    public function testInvokeLabelNameTitle(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/label.json', new LabelNameTitle());
        $dot = ($this->drawDiagram)($profile, new LabelNameTitle());
        $this->assertStringContainsString('State1 -> State1 [label = <safe>', $dot);
        $this->assertStringContainsString('State1 -> State2 [label = <<b><u>unsafe</u></b>>', $dot);
        $this->assertStringContainsString('State1 -> State3 [label = <<u>idempotent</u>>', $dot);
    }

    public function testExternalHref(): void
    {
        $alpsFile = __DIR__ . '/Fake/extern_href.json';
        $dot = ($this->drawDiagram)(new Profile($alpsFile, new LabelName()), new LabelName());
        $this->assertStringContainsString('(min)', $dot);
    }

    public function testMultipleLink(): void
    {
        $alpsFile = __DIR__ . '/Fake/multiple_link/multiple_link.json';
        $dot = ($this->drawDiagram)(new Profile($alpsFile, new LabelName()), new LabelName());
        $numberOfArrow = substr_count($dot, 'Index -> Foo');
        $this->assertSame(1, $numberOfArrow);
    }

    public function testNoState(): void
    {
        $alpsFile = __DIR__ . '/Fake/no_state.json';
        $dot = ($this->drawDiagram)(new Profile($alpsFile, new LabelName()), new LabelName());
        $this->assertStringNotContainsString('name [', $dot);
    }

    public function testShareSameLink(): void
    {
        $alpsFile = __DIR__ . '/Fake/share_link.json';
        $profile = new Profile($alpsFile, new LabelName());
        $dot = ($this->drawDiagram)($profile, new LabelName());
        $this->assertStringContainsString('s1 -> s3 [label = <goS3 (safe)>', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = <goS3 (safe)>', $dot);
        $this->assertStringContainsString('s1 [', $dot);
        $this->assertStringContainsString('s2 [', $dot);
        $this->assertStringContainsString('s3 [', $dot);
    }

    public function testTaggedProfileWithoutTag(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $profile = new Profile($alpsFile, new LabelName());
        $dot = ($this->drawDiagram)($profile, new LabelName());
        $this->assertStringContainsString('label="tag test"', $dot);
        $this->assertStringContainsString('s1 -> s2 [label = <t1 (safe)', $dot);
        $this->assertStringContainsString('s1 -> s5 [label = <t5 (safe)', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = <t2 (safe)', $dot);
        $this->assertStringContainsString('s2 -> s4 [label = <t4 (safe)', $dot);
        $this->assertStringContainsString('s3 -> s4 [label = <t3 (safe)', $dot);
        $this->assertStringContainsString('s5 -> s6 [label = <t6 (safe)', $dot);
    }
}
