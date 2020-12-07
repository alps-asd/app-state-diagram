<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_search;
use function array_unique;
use function sprintf;

use const PHP_EOL;

final class AppState
{
    /** @var array<int, string> */
    private $states;

    /** @var array<AbstractDescriptor> */
    private $descriptors;

    /**
     * @param Link[]                    $links
     * @param array<AbstractDescriptor> $descriptors
     */
    public function __construct(array $links, array $descriptors)
    {
        $states = [];
        foreach ($links as $link) {
            $states[] = $link->from;
            $states[] = $link->to;
        }

        $this->states = array_unique($states);
        $this->descriptors = $descriptors;
    }

    public function remove(string $state): void
    {
        while (($index = array_search($state, $this->states, true)) !== false) {
            unset($this->states[$index]);
        }
    }

    public function __toString(): string
    {
        $dot = '';
        foreach ($this->states as $state) {
            $descriptor = $this->descriptors[$state];
            $dot .= sprintf('    %s [URL="docs/%s.%s.html" target="_parent"]' . PHP_EOL, $descriptor->id, $descriptor->type, $descriptor->id);
        }

        return $dot;
    }
}
