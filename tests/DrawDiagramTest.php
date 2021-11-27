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

    public function testInvokeLabelNameBoth(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/label.json', new LabelNameBoth());
        $dot = ($this->drawDiagram)($profile, new LabelNameBoth());
        $this->assertStringContainsString('State1 -> State1 [label = <goState1 (safe)>', $dot);
        $this->assertStringContainsString('State1 -> State2 [label = <<b><u>doUnsafe (unsafe)</u></b>>', $dot);
        $this->assertStringContainsString('State1 -> State3 [label = <<u>doIdempotent (idempotent)</u>>', $dot);
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

    public function testTaggedMultipleLinkWithColor(): string
    {
        $alpsFile = __DIR__ . '/Fake/multiple_link_tag.json';
        $profile = new Profile($alpsFile, new LabelName());
        $taggedProfile = new TaggedProfile(
            new Profile($alpsFile, new LabelName()),
            [],
            ['tag']
        );
        $dot = ($this->drawDiagram)($profile, new LabelName(), $taggedProfile, 'red');
        $this->assertStringContainsString(
            's1 -> s2 [label=<<table border="0"><tr><td align="left" href="docs/safe.t1.html">t1 (safe)</td></tr><tr><td align="left" href="docs/safe.t2.html">t2 (safe)</td></tr></table>> fontsize=13 color="red"]',
            $dot
        );

        return $dot;
    }

    /** @depends testTaggedMultipleLinkWithColor */
    public function testNoTaggedMultipleLink(string $dot): void
    {
        $this->assertStringContainsString(
            's1 -> s3 [label=<<table border="0"><tr><td align="left" href="docs/safe.t3.html">t3 (safe)</td></tr><tr><td align="left" href="docs/safe.t4.html">t4 (safe)</td></tr></table>> fontsize=13]',
            $dot
        );
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

    public function testTaggedProfile(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $taggedProfile = new TaggedProfile(
            new Profile($alpsFile, new LabelName()),
            [],
            ['a', 'b']
        );
        $dot = ($this->drawDiagram)($taggedProfile, new LabelName());
        $this->assertStringContainsString('label="tag test"', $dot);
        $this->assertStringContainsString('s1 -> s2 [label = <t1 (safe)>', $dot);
        $this->assertStringContainsString('s1 -> s5 [label = <t5 (safe)>', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = <t2 (safe)>', $dot);
        $this->assertStringNotContainsString('s2 -> s4 [label = <t4 (safe)>', $dot);
        $this->assertStringNotContainsString('s3 -> s4 [label = <t3 (safe)>', $dot);
        $this->assertStringNotContainsString('s5 -> s6 [label = <t6 (safe)>', $dot);
    }

    public function testTaggedProfileWhenColorIsNull(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $profile = new Profile($alpsFile, new LabelName());
        $taggedProfile = new TaggedProfile(
            new Profile($alpsFile, new LabelName()),
            [],
            ['a', 'b']
        );
        $dot = ($this->drawDiagram)($profile, new LabelName(), $taggedProfile);

        $this->assertStringContainsString('label="tag test"', $dot);
        $this->assertStringContainsString('s2 [label = <s2> URL="docs/semantic.s2.html" target="_parent"]', $dot);
        $this->assertStringContainsString('s3 [label = <s3> URL="docs/semantic.s3.html" target="_parent"]', $dot);
        $this->assertStringContainsString('s4 [label = <s4> URL="docs/semantic.s4.html" target="_parent"]', $dot);
        $this->assertStringContainsString('s5 [label = <s5> URL="docs/semantic.s5.html" target="_parent"]', $dot);
        $this->assertStringContainsString('s6 [label = <s6> URL="docs/semantic.s6.html" target="_parent"]', $dot);

        return $dot;
    }

    /** @depends testTaggedProfileWhenColorIsNull */
    public function testEdgeNoColor(string $dot): void
    {
        $this->assertStringContainsString('s1 -> s2 [label = <t1 (safe)> URL="docs/safe.t1.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s1 -> s5 [label = <t5 (safe)> URL="docs/safe.t5.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = <t2 (safe)> URL="docs/safe.t2.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s2 -> s4 [label = <t4 (safe)> URL="docs/safe.t4.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s3 -> s4 [label = <t3 (safe)> URL="docs/safe.t3.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s5 -> s6 [label = <t6 (safe)> URL="docs/safe.t6.html" target="_parent" fontsize=13]', $dot);
    }

    /** @depends testTaggedProfileWhenColorIsNull */
    public function testSemanticNoColor(string $dot): void
    {
        $this->assertStringContainsString(
            's1 [margin=0.02, label=<<table cellspacing="0" cellpadding="5" border="0"><tr><td>s1<br />(id)<br /></td></tr></table>>,shape=box URL="docs/semantic.s1.html" target="_parent"]',
            $dot
        );
    }

    public function testNoSemanticStateHasColor(): string
    {
        $alpsFile = __DIR__ . '/Fake/alps_tag.json';
        $profile = new Profile($alpsFile, new LabelName());
        $taggedProfile = new TaggedProfile(
            new Profile($alpsFile, new LabelName()),
            [],
            ['a', 'b']
        );
        $dot = ($this->drawDiagram)($profile, new LabelName(), $taggedProfile, 'red');

        $this->assertStringContainsString('label="tag test"', $dot);
        $this->assertStringContainsString('s2 [label = <s2> URL="docs/semantic.s2.html" target="_parent" color="red"]', $dot);
        $this->assertStringContainsString('s3 [label = <s3> URL="docs/semantic.s3.html" target="_parent" color="red"]', $dot);
        $this->assertStringContainsString('s4 [label = <s4> URL="docs/semantic.s4.html" target="_parent"]', $dot);
        $this->assertStringContainsString('s5 [label = <s5> URL="docs/semantic.s5.html" target="_parent" color="red"]', $dot);
        $this->assertStringContainsString('s6 [label = <s6> URL="docs/semantic.s6.html" target="_parent"]', $dot);

        return $dot;
    }

    /**
     * @depends testNoSemanticStateHasColor
     */
    public function testEdgeHasColor(string $dot): void
    {
        $this->assertStringContainsString('s1 -> s2 [label = <t1 (safe)> URL="docs/safe.t1.html" target="_parent" fontsize=13 color="red"]', $dot);
        $this->assertStringContainsString('s1 -> s5 [label = <t5 (safe)> URL="docs/safe.t5.html" target="_parent" fontsize=13 color="red"]', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = <t2 (safe)> URL="docs/safe.t2.html" target="_parent" fontsize=13 color="red"]', $dot);
        $this->assertStringContainsString('s2 -> s4 [label = <t4 (safe)> URL="docs/safe.t4.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s3 -> s4 [label = <t3 (safe)> URL="docs/safe.t3.html" target="_parent" fontsize=13]', $dot);
        $this->assertStringContainsString('s5 -> s6 [label = <t6 (safe)> URL="docs/safe.t6.html" target="_parent" fontsize=13]', $dot);
    }

    /**
     * @depends testNoSemanticStateHasColor
     */
    public function testSemanticHasColor(string $dot): void
    {
        $this->assertStringContainsString(
            's1 [margin=0.02, label=<<table cellspacing="0" cellpadding="5" border="0"><tr><td>s1<br />(id)<br /></td></tr></table>>,shape=box URL="docs/semantic.s1.html" target="_parent" color="red"]',
            $dot
        );
    }

    /**
     * @depends testNoSemanticStateHasColor
     */
    public function testNoStateWhenGivenTaggedProfile(string $dot): void
    {
        $this->assertStringNotContainsString('id [URL="docs/semantic.id.html"', $dot);
        $this->assertStringNotContainsString('t1 [URL="docs/safe.t1.html"', $dot);
        $this->assertStringNotContainsString('t2 [URL="docs/safe.t2.html"', $dot);
        $this->assertStringNotContainsString('t5 [URL="docs/safe.t5.html"', $dot);
    }
}
