<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class ConfigFilter
{
    /** @var array<string>  */
    public $and;

    /** @var array<string>  */
    public $or;

    /** @var string  */
    public $color;

    /**
     * @param array<string> $and
     * @param array<string> $or
     */
    public function __construct(array $and, array $or, string $color)
    {
        $this->and = $and;
        $this->or = $or;
        $this->color = $color;
    }
}
