<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_keys;
use function in_array;
use function spl_object_id;

class Descriptors
{
    /**
     * @var array<string, AbstractDescriptor>
     * @psalm-readonly
     */
    public $descriptors = [];

    public function add(AbstractDescriptor $descriptor): void
    {
        $objectId = spl_object_id($descriptor);
        if (in_array($objectId, array_keys($this->descriptors))) {
            return;
        }

        /** @psalm-suppress InaccessibleProperty */
        $this->descriptors[(string) $objectId] = $descriptor;
    }
}
