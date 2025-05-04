<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;

use function is_file;

/** @psalm-api */
final class Config
{
    /** @var string  */
    public $profile;

    public function __construct(
        string $profile,
        public bool $watch,
        public string $outputMode = DumpDocs::MODE_HTML,
        public int $port = 3000
    ) {
        if (! is_file($profile)) {
            throw new AlpsFileNotReadableException($profile);
        }

        $this->profile = $profile;
    }
}
