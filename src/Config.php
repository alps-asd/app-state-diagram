<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;
use SimpleXMLElement;

use function is_file;
use function property_exists;

final class Config
{
    /** @var string  */
    public $profile;

    /** @var bool  */
    public $watch;

    /** @var ConfigFilter */
    public $filter;

    /** @var bool */
    public $hasTag;

    public function __construct(string $profile, bool $watch, ?SimpleXMLElement $filter)
    {
        if (! is_file($profile)) {
            throw new AlpsFileNotReadableException($profile);
        }

        $this->profile = $profile;
        $this->watch = $watch;
        /** @var array<string> $and */
        $and = $filter instanceof SimpleXMLElement && property_exists($filter, 'and') ? (array) $filter->and : [];
        /** @var array<string> $or */
        $or = $filter instanceof SimpleXMLElement && property_exists($filter, 'or') ? (array) $filter->or : [];
        $color = $filter instanceof SimpleXMLElement && property_exists($filter, 'color') ? (string) $filter->color : '';
        $this->filter = new ConfigFilter($and, $or, $color);
        $this->hasTag = $and || $or;
    }
}
