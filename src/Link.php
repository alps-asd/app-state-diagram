<?php

declare(strict_types=1);

namespace Koriym\AlpsStateDiagram;

class Link
{
    /**
     * @var string
     */
    public $from;

    /**
     * @var string
     */
    public $to;

    /**
     * @var string
     */
    public $label;

    public function __construct(SemanticDescriptor $semantic, TransDescriptor $trans)
    {
        $this->from = $semantic->id;
        $this->to = $trans->rt;
        $this->label = sprintf('%s (%s)', $trans->id, $trans->type);
    }
}
