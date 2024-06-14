<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidLinkRelationException;
use stdClass;
use Stringable;

use function json_encode;
use function sprintf;

final class LinkRelation implements Stringable
{
    /** @var string */
    public $href;

    /** @var string */
    public $rel;

    /** @var string */
    public $title;

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
        /** @psalm-suppress MixedAssignment */
        $this->title = $link->title ?? '';
    }

    public function __toString(): string
    {
        return $this->toLink();
    }

    private function toLink(): string
    {
        $str = sprintf('* <a rel="%s" href="%s">%s</a>', $this->rel, $this->href, $this->rel);
        if ($this->title !== '') {
            $str .= " {$this->title}";
        }

        return $str;
    }
}
