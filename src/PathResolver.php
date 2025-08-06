<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Phar;

use function dirname;

final class PathResolver
{
    public static function getDotJsPath(): string
    {
        $pharRunning = Phar::running(false);

        // Non-PHAR execution (development)
        if ($pharRunning === '') {
            return dirname(__DIR__) . '/asd-sync/dot.js';
        }

        // PHAR execution: asd-sync should be adjacent to PHAR
        return dirname($pharRunning) . '/asd-sync/dot.js'; // @codeCoverageIgnore
    }
}
