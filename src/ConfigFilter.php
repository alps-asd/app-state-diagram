<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

final class ConfigFilter
{
    /** @var list<string>  */
    public $and;

    /** @var list<string>  */
    public $or;

    /** @var string  */
    public $color;

    /**
     * @param list<string> $and
     * @param list<string> $or
     */
    public function __construct(array $and, array $or, string $color)
    {
        $this->and = $and;
        $this->or = $or;
        $this->color = $color;
    }
}
