<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Override;

use function sprintf;

/** @psalm-immutable */
final class LabelName implements LabelNameInterface
{
    #[Override]
    public function getNodeLabel(SemanticDescriptor $descriptor): string
    {
        return $descriptor->id;
    }

    #[Override]
    public function getLinkLabel(TransDescriptor $trans): string
    {
        return sprintf('%s', $trans->id);
    }
}
