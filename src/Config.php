<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;

use function is_file;

final class Config
{
    /** @var string  */
    public $profile;

    /** @var bool */
    public $hasTag;

    public function __construct(
        string $profile,
        public bool $watch,
        public ConfigFilter $filter,
        public string $outputMode = DumpDocs::MODE_HTML,
        public int $port = 3000
    ) {
        if (! is_file($profile)) {
            throw new AlpsFileNotReadableException($profile);
        }

        $this->profile = $profile;
        $this->hasTag = $this->filter->and || $this->filter->or;
    }
}
