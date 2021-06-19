<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function sprintf;

final class LabelName implements LabelNameInterface
{
    public function getNodeLabel(SemanticDescriptor $descriptor): string
    {
        return $descriptor->id;
    }

    public function getLinkLabel(TransDescriptor $trans): string
    {
        $extras = $trans->rel ? sprintf(', %s ', $trans->rel) : ' ';

        return sprintf('%s%s(%s)', $trans->id, $extras, $trans->type);
    }
}
