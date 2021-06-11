<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidLinkRelationException;
use stdClass;

use function json_encode;
use function sprintf;

use const PHP_EOL;

final class LinkRelation
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
        return sprintf('   * %s', $this->toLink());
    }

    private function toLink(): string
    {
        $str = sprintf('rel: %s <a rel="%s" href="%s">%s</a>', $this->rel, $this->rel, $this->href, $this->href);
        if ($this->title !== '') {
            $str .= " {$this->title}" . PHP_EOL;
        }

        return $str;
    }
}
