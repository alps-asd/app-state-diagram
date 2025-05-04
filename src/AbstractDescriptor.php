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
    public string $id;

    /** @psalm-suppress PossiblyUnusedProperty */
    public ?string $def;

    /** @psalm-suppress PossiblyUnusedProperty */
    public stdClass|null|string $doc;

    /** @var list<stdClass>|stdClass */
    public array|stdClass $descriptor = [];
    public string $type = 'semantic';

    /** @psalm-suppress PossiblyUnusedProperty */
    public ?string $rel = null;

    /** @psalm-suppress PossiblyUnusedProperty */
    public stdClass|SemanticDescriptor|null $parent;

    /** @var list<string> */
    public array $tags;
    public string $title;
    public LinkRelations $linkRelations;

    public function __construct(
        object $descriptor,
        ?stdClass $parentDescriptor = null
    ) {
        if (! isset($descriptor->id)) {
            throw new InvalidSemanticsException((string) json_encode($descriptor));
        }

        $this->id = (string) $descriptor->id;
        /** @psalm-suppress MixedAssignment */
        $this->def = $descriptor->def ?? $descriptor->ref ?? $descriptor->src ?? null;
        $this->doc = $this->getDoc($descriptor);
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

        /** @psalm-suppress all */
        $this->linkRelations = new LinkRelations($descriptor->link ?? null);
    }

    /**
     * Retrieves the documentation string from the given descriptor object.
     *
     * XML has doc as a string, while JSON has doc as an object with a value property.
     *
     * @param object $descriptor The object containing a potential doc property.
     *
     * @return string|null The documentation string if available, or null if not present.
     */
    private function getDoc(object $descriptor): string|null
    {
        if (isset($descriptor->doc)) {
            return is_string($descriptor->doc) ? $descriptor->doc : $descriptor->doc->value;
        }

        return null;
    }

    public function htmlLink(): string
    {
        return sprintf('[%s](#%s)', $this->id, $this->id);
    }
}
