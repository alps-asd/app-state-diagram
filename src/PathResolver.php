<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Phar;

use function dirname;
use function file_exists;
use function is_dir;
use function shell_exec;
use function trim;

final class PathResolver
{
    private static function getHomebrewPrefix(): ?string
    {
        // @codeCoverageIgnoreStart
        /** @psalm-suppress ForbiddenCode */
        $prefix = shell_exec('brew --prefix 2>/dev/null');
        if ($prefix !== null && $prefix !== false) {
            $prefix = trim($prefix);
            if ($prefix !== '' && is_dir($prefix)) {
                return $prefix;
            }
        }

        return null;
        // @codeCoverageIgnoreEnd
    }

    public static function getDotJsPath(): string
    {
        $pharRunning = Phar::running(false);

        // Non-PHAR execution (development)
        if ($pharRunning === '') {
            return dirname(__DIR__) . '/asd-sync/dot.js';
        }

        // @codeCoverageIgnoreStart
        // PHAR execution: asd-sync is in the parent directory of bin/
        $pharDir = dirname($pharRunning);
        $projectDir = dirname($pharDir);
        $dotJsPath = $projectDir . '/asd-sync/dot.js';

        // Try version-independent opt path if not found in Cellar (for Homebrew)
        if (! file_exists($dotJsPath)) {
            $homebrewPrefix = self::getHomebrewPrefix();
            if ($homebrewPrefix !== null) {
                $optPath = $homebrewPrefix . '/opt/asd/libexec/asd-sync/dot.js';
                if (file_exists($optPath)) {
                    return $optPath;
                }
            }
        }

        return $dotJsPath;
        // @codeCoverageIgnoreEnd
    }
}
