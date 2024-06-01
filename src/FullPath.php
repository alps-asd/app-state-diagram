<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;

use function dirname;
use function explode;
use function file_exists;
use function sprintf;
use function str_starts_with;
use function strrpos;
use function substr;

final class FullPath
{
    public function __invoke(string $alpsFile, string $href): string
    {
        if (file_exists($href)) {
            return $href;
        }

        if (str_starts_with($href, 'http')) {
            return $href;
        }

        if (str_starts_with($href, '#')) {
            return sprintf('%s%s', $alpsFile, $href);
        }

        [$file] = explode('#', $href);
        if (file_exists($file)) {
            return $href;
        }

        $dirName = $this->getDirname($alpsFile);

        return sprintf('%s/%s', $dirName, $href);
    }

    private function getDirname(string $alpsFile): string
    {
        if (file_exists($alpsFile)) {
            return dirname($alpsFile);
        }

        $pos = strrpos($alpsFile, '/');
        if ($pos === false) {
            throw new AlpsFileNotReadableException($alpsFile);
        }

        return substr($alpsFile, 0, (int) strrpos($alpsFile, '/'));
    }
}
