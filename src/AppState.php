<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_key_exists;
use function sprintf;

use const PHP_EOL;

final class AppState
{
    /** @var array<string, AbstractDescriptor> */
    private $states;

    /** @var array<string, AbstractDescriptor> */
    private $taggedStates;

    /** @var ?string */
    private $color;

    /**
     * @param Link[]                    $links
     * @param array<AbstractDescriptor> $descriptors
     */
    public function __construct(array $links, array $descriptors, ?TaggedAlpsProfile $profile = null, ?string $color = null)
    {
        $taggedStates = new Descriptors();
        if (isset($profile)) {
            foreach ($profile->links as $link) {
                $taggedStates->add($descriptors[$link->from]);
                $taggedStates->add($descriptors[$link->to]);
            }
        }

        $this->taggedStates = $taggedStates->descriptors;

        $states = new Descriptors();
        foreach ($links as $link) {
            if (! array_key_exists($link->from, $this->taggedStates)) {
                $states->add($descriptors[$link->from]);
            }

            if (! array_key_exists($link->to, $this->taggedStates)) {
                $states->add($descriptors[$link->to]);
            }
        }

        $this->states = $states->descriptors;
        $this->color = $color;
    }

    public function remove(string $state): void
    {
        unset($this->states[$state], $this->taggedStates[$state]);
    }

    public function __toString(): string
    {
        $base = '    %s [URL="docs/%s.%s.html" target="_parent"';
        $dot = '';
        foreach ($this->taggedStates as $descriptor) {
            $dot .= $this->format($descriptor, $base);
        }

        foreach ($this->states as $descriptor) {
            $dot .= sprintf($base . ']' . PHP_EOL, $descriptor->id, $descriptor->type, $descriptor->id);
        }

        return $dot;
    }

    private function format(AbstractDescriptor $descriptor, string $base): string
    {
        if ($this->color === null) {
            return sprintf($base . ']' . PHP_EOL, $descriptor->id, $descriptor->type, $descriptor->id);
        }

        return sprintf($base . ' color="%s"]' . PHP_EOL, $descriptor->id, $descriptor->type, $descriptor->id, $this->color);
    }
}
