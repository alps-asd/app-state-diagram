<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function implode;
use function is_array;
use function strtoupper;
use function usort;

use const PHP_EOL;

final class LinkRelations
{
    /** @var list<LinkRelation> */
    private $links;

    /**
     * @param list<stdClass>|stdClass|null $link
     */
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

        usort($linkRelations, static function (LinkRelation $a, LinkRelation $b): int {
            return strtoupper($a->rel) <=> strtoupper($b->rel);
        });

        return $linkRelations;
    }

    public function __toString(): string
    {
        return implode(PHP_EOL, $this->links);
    }
}
