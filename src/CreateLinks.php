<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function explode;
use function in_array;
use function is_string;
use function ksort;
use function property_exists;
use function sprintf;

final class CreateLinks
{
    /** @var array<string, AbstractDescriptor> */
    private $descriptors = [];

    /** @var array<string, Link> */
    private $links = [];

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     * @param list<stdClass>                    $rawDescriptors
     *
     * @return array<string, Link>
     */
    public function __invoke(array $descriptors, array $rawDescriptors): array
    {
        $this->descriptors = $descriptors;
        foreach ($rawDescriptors as $rawDescriptor) {
            $this->scanRawDescriptor($rawDescriptor);
        }

        ksort($this->links);

        return $this->links;
    }

    private function scanRawDescriptor(stdClass $raw): void
    {
        $hasSubDescriptor = property_exists($raw, 'descriptor');
        if ($hasSubDescriptor) {
            /** @var list<stdClass> $raw->descriptor */
            $this->scanTransition(new SemanticDescriptor($raw), $raw->descriptor); // @phpstan-ignore-line
        }
    }

    /**
     * @param list<stdClass> $instances
     */
    private function scanTransition(SemanticDescriptor $semantic, array $instances): void
    {
        foreach ($instances as $instance) {
            $isInternal = property_exists($instance, 'href') && is_string($instance->href) && $instance->href[0] === '#';
            if ($isInternal) {
                $this->addInternalLink($semantic, $instance->href);

                continue;
            }

            $isTransDescriptor = isset($instance->type) && in_array($instance->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                assert(property_exists($instance, 'id') && is_string($instance->id));
                $this->setLink(new Link($semantic, new TransDescriptor($instance, $semantic)));
                $this->descriptors[$instance->id] = new TransDescriptor($instance, $semantic);

                continue;
            }
        }
    }

    private function addInternalLink(SemanticDescriptor $semantic, string $href): void
    {
        [, $descriptorId] = explode('#', $href);
        $isTransDescriptor = isset($this->descriptors[$descriptorId]) && $this->descriptors[$descriptorId] instanceof TransDescriptor;
        if ($isTransDescriptor) {
            $transSemantic = $this->descriptors[$descriptorId];
            $this->setLink(new Link($semantic, $transSemantic));  // @phpstan-ignore-line
        }
    }

    private function setLink(Link $link): void
    {
        $edgeId = sprintf('%s->%s:%s', $link->from, $link->to, $link->transDescriptor->id);
        $this->links[$edgeId] = $link;
    }
}
