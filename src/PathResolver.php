<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Phar;
use RuntimeException;

use function dirname;
use function file_exists;
use function getenv;
use function implode;
use function is_executable;
use function ob_get_clean;
use function ob_start;
use function passthru;
use function rtrim;
use function sprintf;

final class PathResolver
{
    public static function getDotJsPath(): string
    {
        $pharRunning = Phar::running(false);
        $defaultPath = dirname(__DIR__) . '/asd-sync/dot.js';

        // Non-PHAR execution (development)
        if ($pharRunning === '') {
            if (file_exists($defaultPath)) {
                return $defaultPath;
            }

            throw new RuntimeException(sprintf(
                'dot.js not found at expected path: %s',
                $defaultPath
            ));
        }

        // PHAR execution: try multiple strategies
        return self::resolvePharDotJsPath($pharRunning); // @codeCoverageIgnore
    }

    /** @codeCoverageIgnore */
    private static function resolvePharDotJsPath(string $pharPath): string
    {
        $pharDir = dirname($pharPath);

        // Strategy 1: Check adjacent to PHAR
        $adjacentPath = $pharDir . '/asd-sync/dot.js';
        if (file_exists($adjacentPath)) {
            return $adjacentPath;
        }

        // Strategy 2: Check environment variable override
        $envPath = getenv('ASD_SYNC_PATH');
        if ($envPath !== false) {
            $envDotJs = rtrim($envPath, '/') . '/dot.js';
            if (file_exists($envDotJs)) {
                return $envDotJs;
            }
        }

        // Strategy 3: Try dynamic Homebrew prefix detection
        $brewPath = self::detectHomebrewPath();
        if ($brewPath !== null) {
            $homebrewDotJs = $brewPath . '/opt/asd/libexec/asd-sync/dot.js';
            if (file_exists($homebrewDotJs)) {
                return $homebrewDotJs;
            }
        }

        // Strategy 4: Fallback to common Homebrew paths
        $commonPaths = [
            '/opt/homebrew/opt/asd/libexec/asd-sync/dot.js',  // Apple Silicon
            '/usr/local/opt/asd/libexec/asd-sync/dot.js',     // Intel Mac
        ];

        foreach ($commonPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        // All strategies failed
        throw new RuntimeException(sprintf(
            'dot.js not found. Tried paths: %s, %s, %s. ' .
            'Set ASD_SYNC_PATH environment variable to override.',
            $adjacentPath,
            $envPath !== false ? rtrim($envPath, '/') . '/dot.js' : 'N/A (ASD_SYNC_PATH not set)',
            implode(', ', $commonPaths)
        ));
    }

    /** @codeCoverageIgnore */
    private static function detectHomebrewPath(): ?string
    {
        // Check if brew command is available
        if (! is_executable('/opt/homebrew/bin/brew') && ! is_executable('/usr/local/bin/brew')) {
            return null;
        }

        // Try to get brew prefix
        $brewCmd = is_executable('/opt/homebrew/bin/brew') ? '/opt/homebrew/bin/brew' : 'brew';
        $exitCode = 0;

        ob_start();
        passthru("$brewCmd --prefix 2>/dev/null", $exitCode);
        $output = ob_get_clean();

        if ($exitCode === 0 && $output !== false && $output !== '') {
            return rtrim($output);
        }

        return null;
    }
}
