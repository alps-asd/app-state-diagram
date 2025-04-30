<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidSemanticsException;
use stdClass;

use function assert;
use function explode;
use function is_string;
use function json_encode;
use function property_exists;
use function sprintf;

abstract class AbstractDescriptor
{
    public string $id;
    public ?string $def;
    public stdClass|null|string $doc;

    /** @var list<stdClass>|stdClass */
    public array|stdClass $descriptor = [];
    public string $type = 'semantic';
    public ?string $rel = null;
    public stdClass|SemanticDescriptor|null $parent;

    /** @var list<string> */
    public array $tags;
    public string $title;
    public object $source;
    public ?string $href = null;
    public LinkRelations $linkRelations;

    public function __construct(
        object $descriptor,
        ?stdClass $parentDescriptor = null
    ) {
        if (! isset($descriptor->id)) {
            throw new InvalidSemanticsException((string) json_encode($descriptor));
        }

        $this->source = $descriptor;
        $this->id = (string) $descriptor->id;
        /** @psalm-suppress MixedAssignment */
        $this->def = $descriptor->def ?? $descriptor->ref ?? $descriptor->src ?? null;
        /** @psalm-suppress MixedAssignment */
        $this->doc = $descriptor->doc->value ?? null;
        /** @psalm-suppress MixedAssignment */
        $this->descriptor = $descriptor->descriptor ?? [];
        $this->parent = $parentDescriptor;
        /** @var string|list<string> $tag */
        $tag = $descriptor->tag ?? [];
        /** @psalm-suppress MixedAssignment */
        $this->tags = is_string($tag) ? explode(' ', $tag) : $tag;
        /** @psalm-suppress MixedAssignment */
        $this->title = $descriptor->title ?? '';
        if (isset($descriptor->rel)) {
            $this->rel = (string) $descriptor->rel;
        }

        if (property_exists($descriptor, 'href')) {
            assert(is_string($descriptor->href) || $descriptor->href === null);
            $this->href = $descriptor->href;
        }

        /** @psalm-suppress all */
        $this->linkRelations = new LinkRelations($descriptor->link ?? null);
    }

    public function htmlLink(): string
    {
        return sprintf('[%s](#%s)', $this->id, $this->id);
    }
}
