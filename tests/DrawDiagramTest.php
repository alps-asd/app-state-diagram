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
        $this->drawDiagram = new DrawDiagram(new LabelName());
    }

    public function testInvoke(): string
    {
        $profile = new Profile(__DIR__ . '/Fake/fake.json', new LabelName());
        $dot = ($this->drawDiagram)($profile);
        $this->assertStringContainsString('State1 -> State2 [label = <goState2 (safe)>', $dot);
        $this->assertStringContainsString('State2 -> State3 [label = <goState3 (safe)>', $dot);

        return $dot;
    }

    public function testExternalHref(): void
    {
        $alpsFile = __DIR__ . '/Fake/extern_href.json';
        $dot = ($this->drawDiagram)(new Profile($alpsFile, new LabelName()));
        $this->assertStringContainsString('(min)', $dot);
    }

    public function testMultipleLink(): void
    {
        $alpsFile = __DIR__ . '/Fake/multiple_link/multiple_link.json';
        $dot = ($this->drawDiagram)(new Profile($alpsFile, new LabelName()));
        $numberOfArrow = substr_count($dot, 'Index -> Foo');
        $this->assertSame(1, $numberOfArrow);
    }

    public function testNoState(): void
    {
        $alpsFile = __DIR__ . '/Fake/no_state.json';
        $dot = ($this->drawDiagram)(new Profile($alpsFile, new LabelName()));
        $this->assertStringNotContainsString('name [', $dot);
    }

    public function testShareSameLink(): void
    {
        $alpsFile = __DIR__ . '/Fake/share_link.json';
        $profile = new Profile($alpsFile, new LabelName());
        $dot = ($this->drawDiagram)($profile);
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
        $dot = ($this->drawDiagram)($profile);
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
        $dot = ($this->drawDiagram)($taggedProfile);
        $this->assertStringContainsString('label="tag test"', $dot);
        $this->assertStringContainsString('s1 -> s2 [label = <t1 (safe)>', $dot);
        $this->assertStringContainsString('s1 -> s5 [label = <t5 (safe)>', $dot);
        $this->assertStringContainsString('s2 -> s3 [label = <t2 (safe)>', $dot);
        $this->assertStringNotContainsString('s2 -> s4 [label = <t4 (safe)>', $dot);
        $this->assertStringNotContainsString('s3 -> s4 [label = <t3 (safe)>', $dot);
        $this->assertStringNotContainsString('s5 -> s6 [label = <t6 (safe)>', $dot);
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
        $dot = ($this->drawDiagram)($profile, $taggedProfile, 'red');

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
