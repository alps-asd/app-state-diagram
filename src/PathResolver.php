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

        // PHAR execution: asd-sync is in the parent directory of bin/
        $pharDir = dirname($pharRunning);
        $projectDir = dirname($pharDir);

        return $projectDir . '/asd-sync/dot.js'; // @codeCoverageIgnore
    }
}
