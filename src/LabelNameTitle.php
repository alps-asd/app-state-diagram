<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Override;

use function str_replace;

/** @psalm-immutable */
final class LabelNameTitle implements LabelNameInterface
{
    #[Override]
    public function getNodeLabel(SemanticDescriptor $descriptor): string
    {
        return $descriptor->title ?: $descriptor->id;
    }

    #[Override]
    public function getLinkLabel(TransDescriptor $trans): string
    {
        $title = $trans->title ?: $trans->id;

        return str_replace(' ', '&nbsp;', $title);
    }
}
