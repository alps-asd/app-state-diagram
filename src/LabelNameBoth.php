<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function sprintf;

final class LabelNameBoth implements LabelNameInterface
{
    public function getNodeLabel(SemanticDescriptor $descriptor): string
    {
        return $descriptor->title ? sprintf('%s, %s', $descriptor->id, $descriptor->title) : $descriptor->id;
    }

    public function getLinkLabel(TransDescriptor $trans): string
    {
        $title = $trans->title ? sprintf('%s (%s)', $trans->id, $trans->title) : $trans->id;
        if ($trans->type === 'idempotent') {
            return sprintf('<u>%s</u>', $title);
        }

        if ($trans->type === 'unsafe') {
            return sprintf('<b><u>%s</u></b>', $title);
        }

        return $title;
    }
}
