<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class Link
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

    /**
     * @var array
     */
    private $labels = [];

    public function __construct(SemanticDescriptor $semantic, TransDescriptor $trans)
    {
        $this->from = $semantic->id;
        $this->to = $trans->rt;
        $this->label = sprintf('%s (%s)', $trans->id, $trans->type);
        $this->labels[] = $this->label;
    }

    public function __toString()
    {
        return $this->label;
    }

    public function add(self $link) : self
    {
        if (in_array($link->label, $this->labels, true)) {
            return $this;
        }

        $this->label .= ", {$link->label}";

        return $this;
    }
}
