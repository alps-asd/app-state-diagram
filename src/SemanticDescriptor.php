<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\InvalidSemanticsException;

class SemanticDescriptor
{
    /**
     * @var string
     */
    public $id;

    public function __construct(object $descriptor)
    {
        if (! isset($descriptor->type) || ! isset($descriptor->id) || $descriptor->type !== 'semantic') {
            throw new InvalidSemanticsException();
        }
        $this->id = $descriptor->id;
    }
}
