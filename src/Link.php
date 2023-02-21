<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class Link implements \Stringable
{
    /** @var string */
    public $from;

    /** @var string */
    public $to;

    /** @var string */
    public $label;

    /** @var TransDescriptor */
    public $transDescriptor;

    public function __construct(SemanticDescriptor $semantic, TransDescriptor $trans, LabelNameInterface $labelName)
    {
        $this->from = $semantic->id;
        $this->to = $trans->rt;
        $this->label = $labelName->getLinkLabel($trans);
        $this->transDescriptor = $trans;
    }

    public function __toString(): string
    {
        return $this->label;
    }
}
