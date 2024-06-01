<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function filter_var;

use const FILTER_VALIDATE_INT;

/** @psalm-immutable */
final class Option
{
    public bool $watch;
    public int $port;
    public string $mode;

    /** @param array<string, string|bool> $options */
    public function __construct(array $options, ?int $port)
    {
        $this->watch = isset($options['w']) || isset($options['watch']);
        $this->mode = $this->getMode($options);
        $this->port = $this->getPort($options, $port);
    }

    /** @param array<string, string|bool> $options */
    private function getMode(array $options): string
    {
        $isMarkdown = isset($options['mode']) && $options['mode'] === DumpDocs::MODE_MARKDOWN;

        return $isMarkdown ? DumpDocs::MODE_MARKDOWN : DumpDocs::MODE_HTML;
    }

    /** @param array<string, string|bool> $options */
    private function getPort(array $options, ?int $port): int
    {
        $value = $options['port'] ?? $port;
        if ($value === null) {
            return 3000;
        }

        return filter_var(
            $value,
            FILTER_VALIDATE_INT,
            [
                'options' => [
                    'default' => 3000,
                    'min_range' => 1024,
                    'max_range' => 49151,
                ],
            ]
        );
    }
}
