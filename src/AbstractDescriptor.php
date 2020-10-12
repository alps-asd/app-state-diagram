<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\InvalidSemanticsException;
use stdClass;

use function json_encode;

abstract class AbstractDescriptor
{
    /** @var string */
    public $id;

    /** @var string|null */
    public $def;

    /** @var stdClass|null */
    public $doc;

    /** @var list<stdClass> */
    public $descriptor;

    public function __construct(object $descriptor)
    {
        if (! isset($descriptor->type, $descriptor->id)) {
            throw new InvalidSemanticsException((string) json_encode($descriptor));
        }

        $this->id = $descriptor->id;
        $this->def = $descriptor->def ?? $descriptor->ref ?? $descriptor->src ?? null; // @phpstan-ignore-line
        $this->doc = $descriptor->doc ?? null; // @phpstan-ignore-line
        $this->descriptor = $descriptor->descriptor ?? []; // @phpstan-ignore-line
    }
}
