<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function assert;
use function count;
use function in_array;
use function sprintf;

use const PHP_EOL;

final class Edge
{
    /** @var AbstractProfile */
    private $profile;

    /** @var ?string */
    private $color;

    /** @var ?TaggedProfile */
    private $taggedProfile;

    public function __construct(AbstractProfile $profile, ?TaggedProfile $taggedProfile = null, ?string $color = null)
    {
        $this->profile = $profile;
        $this->color = $color;
        $this->taggedProfile = $taggedProfile;
    }

    public function __toString(): string
    {
        $graph = '';
        /** @psalm-suppress MixedArgumentTypeCoercion */
        $groupedLinks = $this->groupEdges($this->profile->links);
        foreach ($groupedLinks as $fromTo => $link) {
            $graph .= count($link) === 1 ? $this->singleLink($link) : $this->multipleLink($fromTo, $link);
        }

        return $graph;
    }

    /**
     * @param list<Link> $links
     */
    private function singleLink(array $links): string
    {
        $link = $links[0];
        $base = '    %s -> %s [label = <%s> URL="docs/%s.%s.html" target="_parent" fontsize=13';

        if (! isset($this->color, $this->taggedProfile)) {
            return sprintf($base . '];' . PHP_EOL, $link->from, $link->to, $link->label, $link->transDescriptor->type, $link->transDescriptor->id);
        }

        if (in_array($link, $this->taggedProfile->links)) {
            return sprintf($base . ' color="%s"];' . PHP_EOL, $link->from, $link->to, $link->label, $link->transDescriptor->type, $link->transDescriptor->id, $this->color);
        }

        return sprintf($base . '];' . PHP_EOL, $link->from, $link->to, $link->label, $link->transDescriptor->type, $link->transDescriptor->id);
    }

    /**
     * @param list<Link> $links
     */
    private function multipleLink(string $fromTo, array $links): string
    {
        assert(isset($links[0]));
        $trs = '';
        foreach ($links as $link) {
            $trs .= sprintf('<tr><td align="left" href="docs/%s.%s.html">%s (%s)</td></tr>', $link->transDescriptor->type, $link->transDescriptor->id, $link->transDescriptor->id, $link->transDescriptor->type);
        }

        $base = '    %s -> %s [label=<<table  border="0">%s</table>> fontsize=13';

        if (! isset($this->color, $this->taggedProfile)) {
            return sprintf($base . '];' . PHP_EOL, $links[0]->from, $links[0]->to, $trs);
        }

        foreach ($links as $link) {
            if (in_array($link, $this->taggedProfile->links)) {
                return sprintf($base . ' color="%s"];' . PHP_EOL, $links[0]->from, $links[0]->to, $trs);
            }
        }

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
