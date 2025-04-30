<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function sprintf;

/** @psalm-immutable */
final class LabelName implements LabelNameInterface
{
    public function getNodeLabel(SemanticDescriptor $descriptor): string
    {
        return $descriptor->id;
    }

    public function getLinkLabel(TransDescriptor $trans): string
    {
        return sprintf('%s', $trans->id);
    }
}
