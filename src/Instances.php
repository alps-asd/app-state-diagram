<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function is_string;
use function ksort;
use function property_exists;

/**
 * Descriptor instance (raw object) container
 */
class Instances
{
    /** @var array<string, stdClass> */
    private $insntances = [];

    public function add(stdClass $instance): void
    {
        assert(property_exists($instance, 'id'));
        assert(is_string($instance->id));
        $this->insntances[$instance->id] = $instance;
        ksort($this->insntances);
    }

    /**
     * @return array<string, stdClass>
     */
    public function get(): array
    {
        return $this->insntances;
    }
}
