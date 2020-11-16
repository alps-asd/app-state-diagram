<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function sprintf;

final class Link
{
    /** @var string */
    public $from;

    /** @var string */
    public $to;

    /** @var string */
    public $label;

    /** @var TransDescriptor */
    public $transDescriptor;

    /** @var list<string> */
    private $labels = [];

    public function __construct(SemanticDescriptor $semantic, TransDescriptor $trans)
    {
        $this->from = $semantic->id;
        $this->to = $trans->rt;
        $title = $trans->rel ? sprintf('%s, %s', $trans->id, $trans->rel) : $trans->id;
        $this->label = sprintf('%s (%s)', $title, $trans->type);
        $this->labels[] = $this->label;
        $this->transDescriptor = $trans;
    }

    public function __toString(): string
    {
        return $this->label;
    }
}
