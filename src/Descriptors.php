<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_key_exists;

final class Descriptors
{
    /** @var array<string, AbstractDescriptor> */
    public $descriptors = [];

    public function add(AbstractDescriptor $descriptor): void
    {
        if (array_key_exists($descriptor->id, $this->descriptors)) {
            return;
        }

        /** @psalm-suppress InaccessibleProperty */
        $this->descriptors[$descriptor->id] = $descriptor;
    }
}
