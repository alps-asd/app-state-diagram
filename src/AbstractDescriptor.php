<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidSemanticsException;
use stdClass;

use function explode;
use function is_string;
use function json_encode;
use function sprintf;

abstract class AbstractDescriptor
{
    /** @var string */
    public $id;

    /** @var ?string */
    public $def;

    /** @var stdClass|null */
    public $doc;

    /** @var list<stdClass> */
    public $descriptor;

    /** @var string */
    public $type = 'semantic';

    /** @var ?string */
    public $rel;

    /** @var stdClass|SemanticDescriptor|null */
    public $parent;

    /** @var list<string> */
    public $tags;

    /** @var string */
    public $title;

    /** @var object */
    public $source;

    /** @var LinkRelations */
    public $linkRelations;

    public function __construct(object $descriptor, ?stdClass $parentDescriptor = null)
    {
        if (! isset($descriptor->id)) {
            throw new InvalidSemanticsException((string) json_encode($descriptor));
        }

        $this->source = $descriptor;
        $this->id = (string) $descriptor->id;
        /** @psalm-suppress MixedAssignment */
        $this->def = $descriptor->def ?? $descriptor->ref ?? $descriptor->src ?? null; // @phpstan-ignore-line
        /** @psalm-suppress MixedAssignment */
        $this->doc = $descriptor->doc ?? null; // @phpstan-ignore-line
        /** @psalm-suppress MixedAssignment */
        $this->descriptor = $descriptor->descriptor ?? []; // @phpstan-ignore-line
        $this->parent = $parentDescriptor;
        /** @psalm-suppress MixedAssignment */
        $tag = $descriptor->tag ?? [];  // @phpstan-ignore-line
        /** @psalm-suppress MixedAssignment */
        $this->tags = is_string($tag) ? explode(' ', $tag) : $tag; //@phpstan-ignore-line
        /** @psalm-suppress MixedAssignment */
        $this->title = $descriptor->title ?? ''; //@phpstan-ignore-line
        if (isset($descriptor->rel)) {
            $this->rel = (string) $descriptor->rel;
        }

        /** @psalm-suppress all */
        $this->linkRelations = new LinkRelations($descriptor->link ?? null); // @phpstan-ignore-line
    }

    public function htmlLink(): string
    {
        return sprintf('[%s](%s.%s.html)', $this->id, $this->type, $this->id);
    }
}
