<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class LabelNameFactory
{
    private function __construct()
    {
    }

    public static function getInstance(string $label): LabelNameInterface
    {
        if ($label === 'title') {
            return new LabelNameTitle();
        }

        if ($label === 'both') {
            return new LabelNameBoth();
        }

        return new LabelName();
    }
}
