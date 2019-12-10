<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

use Koriym\AlpsStateDiagram\Exception\RtMissingException;
use Koriym\AlpsStateDiagram\Exception\RtNotRefException;
use Koriym\AlpsStateDiagram\Exception\TypeSemanticException;

final class TransDescriptor
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
    public $paren;

    public function __construct(\stdClass $descriptor, SemanticDescriptor $parent)
    {
        if ($descriptor->type === 'semantic') {
            throw new TypeSemanticException($descriptor->id);
        }
        $this->id = $descriptor->id;
        $this->type = $descriptor->type;
        if (! isset($descriptor->rt)) {
            throw new RtMissingException($descriptor->id);
        }
        $isRtRef = substr($descriptor->rt, 0, 1) === '#';
        if (! $isRtRef) {
            throw new RtNotRefException($descriptor->rt);
        }
        $this->rt = substr($descriptor->rt, 1);
        $this->paren = $parent;
    }
}
