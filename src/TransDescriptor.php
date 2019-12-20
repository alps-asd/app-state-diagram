<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\RtMissingException;
use Koriym\AppStateDiagram\Exception\TypeSemanticException;

final class TransDescriptor implements DescriptorInterface
{
    /**
     * @var string
     */
    public $id;

    /**
     * @var string
     */
    public $type;

    /**
     * @var string
     */
    public $rt;

    /**
     * @var SemanticDescriptor
     */
    public $parent;

    public function __construct(\stdClass $descriptor, SemanticDescriptor $parent)
    {
        if ($descriptor->type === 'semantic') {
            throw new TypeSemanticException($descriptor->id);
        }
        if (! isset($descriptor->rt)) {
            throw new RtMissingException($descriptor->id);
        }
        $this->id = $descriptor->id;
        $this->type = $descriptor->type;
        $pos = strpos($descriptor->rt, '#');
        if ($pos === false) {
            throw new RtMissingException($descriptor->id);
        }
        $this->rt = substr($descriptor->rt, $pos + 1);
        $this->parent = $parent;
    }
}
