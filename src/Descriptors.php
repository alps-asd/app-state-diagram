<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_key_exists;

class Descriptors
{
    /**
     * @var array<string, AbstractDescriptor>
     * @psalm-readonly
     */
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
