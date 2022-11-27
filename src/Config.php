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
    public $outputMode;

    /** @var int */
    public $port;

    public function __construct(
        string $profile,
        bool $watch,
        ConfigFilter $filter,
        string $outputMode = DumpDocs::MODE_HTML,
        int $port = 3000
    ) {
        if (! is_file($profile)) {
            throw new AlpsFileNotReadableException($profile);
        }

        $this->profile = $profile;
        $this->watch = $watch;
        $this->filter = $filter;
        $this->hasTag = $filter->and || $filter->or;
        $this->outputMode = $outputMode;
        $this->port = $port;
    }
}
