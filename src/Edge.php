<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Stringable;

use function assert;
use function count;
use function sprintf;

use const PHP_EOL;

final class Edge implements Stringable
{
    public function __construct(
        private readonly AbstractProfile $profile
    ) {
    }

    public function __toString(): string
    {
        $graph = '';
        /** @psalm-suppress MixedArgumentTypeCoercion */
        $groupedLinks = $this->groupEdges($this->profile->links);
        foreach ($groupedLinks as $link) {
            $graph .= count($link) === 1 ? $this->singleLink($link) : $this->multipleLink($link);
        }

        return $graph;
    }

    /** @param list<Link> $links */
    private function singleLink(array $links): string
    {
        $link = $links[0];
        $base = '    %s -> %s [label = <%s> URL="#%s" target="_parent" fontsize=13 class="%s" penwidth=1.5';

        return sprintf($base . '];' . PHP_EOL, $link->from, $link->to, $link->label, $link->transDescriptor->id, $link->transDescriptor->id);
    }

    /** @param list<Link> $links */
    private function multipleLink(array $links): string
    {
        assert(isset($links[0]));
        $trs = '';
        foreach ($links as $link) {
            $trs .= sprintf(
                '<tr><td align="left" href="#%s" tooltip="%s (%s)" >%s (%s)</td></tr>',
                $link->transDescriptor->id,
                $link->transDescriptor->id,
                $link->transDescriptor->type,
                $link->label,
                $link->transDescriptor->type
            );
        }

        $base = '    %s -> %s [label=<<table border="0">%s</table>> fontsize=13';

        return sprintf($base . '];' . PHP_EOL, $links[0]->from, $links[0]->to, $trs);
    }

    /**
     * @param array<string, Link> $links
     *
     * @return array<string, list<Link>>
     */
    private function groupEdges(array $links): array
    {
        $groupedLinks = [];
        foreach ($links as $link) {
            $fromTo = $link->from . $link->to;
            $groupedLinks[$fromTo][] = $link;
        }

        return $groupedLinks;
    }
}
