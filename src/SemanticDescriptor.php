<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\InvalidSemanticsException;

class SemanticDescriptor implements DescriptorInterface
{
    /**
     * @var string
     */
    public $id;

    /**
     * @var object
     */
    public $descriptor;

    public function __construct(object $descriptor)
    {
        if (! isset($descriptor->type) || ! isset($descriptor->id) || $descriptor->type !== 'semantic') {
            throw new InvalidSemanticsException();
        }
        $this->id = $descriptor->id;
        $this->descriptor = isset($descriptor->descriptor) ? $descriptor->descriptor : null;
    }
}
