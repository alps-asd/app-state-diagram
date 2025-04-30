<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function sprintf;
use function str_replace;

/** @psalm-immutable */
final class LabelNameTitle implements LabelNameInterface
{
    public function getNodeLabel(SemanticDescriptor $descriptor): string
    {
        return $descriptor->title ?: $descriptor->id;
    }

    public function getLinkLabel(TransDescriptor $trans): string
    {
        $title = $trans->title ?: $trans->id;
        $title = str_replace(' ', '&nbsp;', $title);

        return $title;
    }
}
