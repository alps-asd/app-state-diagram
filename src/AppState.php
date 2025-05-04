<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Override;
use Stringable;

use function array_key_exists;
use function assert;
use function sprintf;

use const PHP_EOL;

/** @psalm-immutable */
final class AppState implements Stringable
{
    /** @var array<string, AbstractDescriptor> */
    private $states;

    /**
     * @param Link[]                    $links
     * @param array<AbstractDescriptor> $descriptors
     *
     * @psalm-suppress ImpureMethodCall
     */
    public function __construct(
        array $links,
        array $descriptors,
        private readonly LabelNameInterface $labelName,
    ) {
        $taggedStates = new Descriptors();

        $taggedStates = $taggedStates->descriptors;

        $states = new Descriptors();
        foreach ($links as $link) {
            if (! array_key_exists($link->from, $taggedStates)) {
                $states->add($descriptors[$link->from]);
            }

            if (! array_key_exists($link->to, $taggedStates)) {
                if (! isset($descriptors[$link->to])) {
                    continue; // @codeCoverageIgnore
                }

                $states->add($descriptors[$link->to]);
            }
        }

        $this->states = $states->descriptors;
    }

    #[Override]
    public function __toString(): string
    {
        $base = '    %s [label = <%s> URL="#%s" target="_parent"';
        $dot = '';

        foreach ($this->states as $descriptor) {
            assert($descriptor instanceof SemanticDescriptor);
            $dot .= sprintf($base . ']' . PHP_EOL, $descriptor->id, $this->labelName->getNodeLabel($descriptor), $descriptor->id);
        }

        return $dot;
    }
}
