<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class ConfigFilter
{
    /**
     * @param list<string> $and
     * @param list<string> $or
     */
    public function __construct(public array $and, public array $or, public string $color)
    {
    }
}
