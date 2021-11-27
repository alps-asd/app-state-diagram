<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

interface LabelNameInterface
{
    /** @psalm-pure  */
    public function getNodeLabel(SemanticDescriptor $descriptor): string;

    public function getLinkLabel(TransDescriptor $trans): string;
}
