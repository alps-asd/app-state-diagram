<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\AlpsFileNotReadableException;

use function dirname;
use function explode;
use function file_exists;
use function sprintf;
use function strrpos;
use function substr;

final class FullPath
{
    public function __invoke(string $alpsFile, string $href): string
    {
        if (file_exists($href)) {
            return $href;
        }

        if (substr($href, 0, 4) === 'http') {
            return $href;
        }

        if (substr($href, 0, 1) === '#') {
            return sprintf('%s%s', $alpsFile, $href);
        }

        [$file] = explode('#', $href);
        if (file_exists($file)) {
            return $href;
        }

        return sprintf('%s/%s', $this->getDirname($alpsFile), $href);
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

        return substr($alpsFile, 0, (int) strrpos($alpsFile, '/') + 1);
    }
}
