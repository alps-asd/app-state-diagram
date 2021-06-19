<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

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

    /** @var LabelNameInterface */
    private $labelName;

    public function __construct(SemanticDescriptor $semantic, TransDescriptor $trans, LabelNameInterface $labelName)
    {
        $this->from = $semantic->id;
        $this->to = $trans->rt;
        $this->label = $labelName->getLinkLabel($trans);
        $this->labels[] = $this->label;
        $this->transDescriptor = $trans;
        $this->labelName = $labelName;
    }

    public function __toString(): string
    {
        return $this->label;
    }
}
