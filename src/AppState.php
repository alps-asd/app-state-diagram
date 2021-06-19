<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_key_exists;
use function assert;
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

    /** @var LabelNameInterface */
    private $labelName;

    /**
     * @param Link[]                    $links
     * @param array<AbstractDescriptor> $descriptors
     */
    public function __construct(array $links, array $descriptors, LabelNameInterface $labelName, ?TaggedProfile $profile = null, ?string $color = null)
    {
        $this->labelName = $labelName;
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
                if (! isset($descriptors[$link->to])) {
                    continue;
                    // throw new LogicException($link->to);
                }

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
        $base = '    %s [label = <%s> URL="docs/%s.%s.html" target="_parent"';
        $dot = '';
        foreach ($this->taggedStates as $descriptor) {
            $dot .= $this->format($descriptor, $base);
        }

        foreach ($this->states as $descriptor) {
            assert($descriptor instanceof SemanticDescriptor);
            $dot .= sprintf($base . ']' . PHP_EOL, $descriptor->id, $this->labelName->getNodeLabel($descriptor), $descriptor->type, $descriptor->id);
        }

        return $dot;
    }

    private function format(AbstractDescriptor $descriptor, string $base): string
    {
        if ($this->color === null) {
            $template = $base . ']' . PHP_EOL;

            return sprintf($template, $descriptor->id, $descriptor->type, $descriptor->id);
        }

        $template = $base . ' color="%s"]' . PHP_EOL;
        assert($descriptor instanceof SemanticDescriptor);

        return sprintf($template, $descriptor->id, $this->labelName->getNodeLabel($descriptor), $descriptor->type, $descriptor->id, $this->color);
    }
}
