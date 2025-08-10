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
    public static function isDotCommandAvailable(): bool
    {
        // @codeCoverageIgnoreStart
        /** @psalm-suppress ForbiddenCode */
        $dotExists = shell_exec('command -v dot 2>/dev/null');

        return $dotExists !== null && $dotExists !== false && trim($dotExists) !== '';
        // @codeCoverageIgnoreEnd
    }

    public static function getHomebrewPrefix(): ?string
    {
        // @codeCoverageIgnoreStart
        // Check if brew command exists
        /** @psalm-suppress ForbiddenCode */
        $brewExists = shell_exec('command -v brew 2>/dev/null');
        if ($brewExists === null || $brewExists === false || trim($brewExists) === '') {
            return null;
        }

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
        // PHAR execution: check Cellar path first, then fallback to opt path
        $pharDir = dirname($pharRunning);

        // Try Cellar path first (e.g., /opt/homebrew/Cellar/asd/x.x.x/libexec/asd-sync/dot.js)
        $dotJsPath = $pharDir . '/asd-sync/dot.js';
        if (file_exists($dotJsPath)) {
            return $dotJsPath;
        }

        // Try version-independent opt path (for Homebrew)
        $homebrewPrefix = self::getHomebrewPrefix();
        if ($homebrewPrefix !== null) {
            $optPath = $homebrewPrefix . '/opt/asd/libexec/asd-sync/dot.js';
            if (file_exists($optPath)) {
                return $optPath;
            }
        }

        // Fallback to the original path
        return $dotJsPath;
        // @codeCoverageIgnoreEnd
    }
}
