<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function sprintf;

/** @codeCoverageIgnore  */
final class Links
{
    /** @var array<string, Link> */
    public $links = [];

    public function add(Link $link): void
    {
        $edgeId = sprintf('%s->%s:%s', $link->from, $link->to, $link->transDescriptor->id);

        /** @psalm-suppress InaccessibleProperty */
        $this->links[$edgeId] = $link;
    }
}
