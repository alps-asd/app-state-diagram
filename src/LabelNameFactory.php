<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class LabelNameFactory
{
    // @codeCoverageIgnoreStart
    // phpcs:ignore Squiz.Commenting.FunctionComment.WrongStyle
    private function __construct()
    {
    }

    // @codeCoverageIgnoreEnd
    // phpcs:ignore Squiz.Commenting.FunctionComment.WrongStyle

    public static function getInstance(string $label): LabelNameInterface
    {
        if ($label === 'title') {
            return new LabelNameTitle();
        }

        return new LabelName();
    }
}
