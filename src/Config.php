<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;

use function is_file;

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

    /** @var string */
    public $label;

    public function __construct(string $profile, bool $watch, string $label, ConfigFilter $filter)
    {
        if (! is_file($profile)) {
            throw new AlpsFileNotReadableException($profile);
        }

        $this->profile = $profile;
        $this->watch = $watch;
        $this->filter = $filter;
        $this->hasTag = $filter->and || $filter->or;
        $this->label = $label;
    }
}
