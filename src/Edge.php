<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function count;
use function sprintf;

use const PHP_EOL;

final class Edge
{
    /** @var array<string, Link> */
    private $links = [];

    /**
     * @param array<string, Link> $links
     */
    public function __construct(array $links)
    {
        $this->links = $links;
    }

    public function __toString(): string
    {
        $graph = '';
        $groupedLinks = $this->groupEdges($this->links);
        foreach ($groupedLinks as $fromtTo => $link) {
            $graph .= count($link) === 1 ? $this->singleLink($link) : $this->multipleLink($fromtTo, $link);
        }

        return $graph;
    }

    /**
     * @param list<Link> $links
     */
    private function singleLink(array $links): string
    {
        $link = $links[0];

        return sprintf('    %s -> %s [fontsize=12 label = "%s" URL="docs/%s.%s.html"];', $link->from, $link->to, $link->label, $link->transDescriptor->type, $link->transDescriptor->id) . PHP_EOL;
    }

    /**
     * @param list<Link> $links
     */
    private function multipleLink(string $fromtTo, array $links): string
    {
        assert(isset($links[0]));
        $trs = '';
        foreach ($links as $link) {
            $trs .= sprintf('<tr><td align="left" href="docs/%s.%s.html">%s (%s)</td></tr>', $link->transDescriptor->type, $link->transDescriptor->id, $link->transDescriptor->id, $link->transDescriptor->type);
        }

        return sprintf('    %s -> %s [fontsize=13 label=<<table  border="0">%s</table>>];', $links[0]->from, $links[0]->to, $trs) . PHP_EOL;
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
