<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Override;
use stdClass;
use Stringable;

use function implode;
use function is_array;
use function sprintf;
use function strtoupper;
use function usort;

use const PHP_EOL;

final class LinkRelations implements Stringable
{
    /** @var list<LinkRelation> */
    private $links;

    /** @param list<stdClass>|stdClass|null $link */
    public function __construct($link = null)
    {
        if ($link === null) {
            $this->links = [];

            return;
        }

        if (is_array($link)) {
            $this->links = $this->createLinkRelations($link);

            return;
        }

        $this->links = [new LinkRelation($link)];
    }

    /**
     * @param list<stdClass> $links
     *
     * @return list<LinkRelation>
     */
    private function createLinkRelations(array $links): array
    {
        $linkRelations = [];
        foreach ($links as $link) {
            $linkRelations[] = new LinkRelation($link);
        }

        usort($linkRelations, static fn (LinkRelation $a, LinkRelation $b): int => strtoupper($a->rel) <=> strtoupper($b->rel));

        return $linkRelations;
    }

    #[Override]
    public function __toString(): string
    {
        return implode(PHP_EOL, $this->links);
    }

    public function getLinksInExtras(): string
    {
        $links = [];
        foreach ($this->links as $link) {
            $label = $link->title !== '' ? $link->title : $link->rel;
            $links[] = sprintf('link: [%s](%s)', $label, $link->href);
        }

        return implode(', ', $links);
    }
}
