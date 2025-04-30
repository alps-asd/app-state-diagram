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
        $this->assertStringContainsString('State1 -> State2 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#goState2" tooltip="goState2 (safe)"><font color="#00A86B">■</font> goState2</td></tr></table>>', $dot);
        $this->assertStringContainsString('State2 -> State3 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#goState3" tooltip="goState3 (safe)"><font color="#00A86B">■</font> goState3</td></tr></table>>', $dot);

        return $dot;
    }

    public function testInvokeLabelNameTitle(): void
    {
        $profile = new Profile(__DIR__ . '/Fake/label.json', new LabelNameTitle());
        $dot = ($this->drawDiagram)($profile, new LabelNameTitle());
        $this->assertStringContainsString('State1 -> State1 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#goState1" tooltip="safe (safe)"><font color="#00A86B">■</font> safe</td></tr></table>>', $dot);
        $this->assertStringContainsString('State1 -> State2 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#doUnsafe" tooltip="unsafe (unsafe)"><font color="#FF4136">■</font> unsafe</td></tr></table>>', $dot);
        $this->assertStringContainsString('State1 -> State3 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#doIdempotent" tooltip="idempotent (idempotent)"><font color="#FFDC00">■</font> idempotent</td></tr></table>>', $dot);
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
        $this->assertStringContainsString('s1 -> s3 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#goS3" tooltip="goS3 (safe)"><font color="#00A86B">■</font> goS3</td></tr></table>>', $dot);
        $this->assertStringContainsString('s2 -> s3 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#goS3" tooltip="goS3 (safe)"><font color="#00A86B">■</font> goS3</td></tr></table>>', $dot);
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
        $this->assertStringContainsString('s1 -> s2 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#t1" tooltip="t1 (safe)"><font color="#00A86B">■</font> t1</td></tr></table>>', $dot);
        $this->assertStringContainsString('s1 -> s5 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#t5" tooltip="t5 (safe)"><font color="#00A86B">■</font> t5</td></tr></table>>', $dot);
        $this->assertStringContainsString('s2 -> s3 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#t2" tooltip="t2 (safe)"><font color="#00A86B">■</font> t2</td></tr></table>>', $dot);
        $this->assertStringContainsString('s2 -> s4 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#t4" tooltip="t4 (safe)"><font color="#00A86B">■</font> t4</td></tr></table>>', $dot);
        $this->assertStringContainsString('s3 -> s4 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#t3" tooltip="t3 (safe)"><font color="#00A86B">■</font> t3</td></tr></table>>', $dot);
        $this->assertStringContainsString('s5 -> s6 [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#t6" tooltip="t6 (safe)"><font color="#00A86B">■</font> t6</td></tr></table>>', $dot);
    }

    public function testRenderTitle(): void
    {
        $alpsFile = __DIR__ . '/Fake/alps.title.xml';
        $profile = new Profile($alpsFile, new LabelNameTitle());
        $dot = ($this->drawDiagram)($profile, new LabelNameTitle());
        $this->assertStringContainsString('tooltip="go next state (safe)"', $dot);
    }
}
