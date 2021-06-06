<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidLinkRelationException;
use stdClass;

use function json_encode;
use function sprintf;

final class LinkRelation
{
    /** @var string */
    public $href;

    /** @var string */
    public $rel;

    public function __construct(stdClass $link)
    {
        if (! isset($link->href)) {
            throw new InvalidLinkRelationException((string) json_encode($link));
        }

        if (! isset($link->rel)) {
            throw new InvalidLinkRelationException((string) json_encode($link));
        }

        /** @psalm-suppress MixedAssignment */
        $this->href = $link->href;

        /** @psalm-suppress MixedAssignment */
        $this->rel = $link->rel;
    }

    public function __toString(): string
    {
        return sprintf('   * [%s](%s)', $this->rel, $this->href);
    }
}
