<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function explode;
use function in_array;
use function is_int;
use function is_string;
use function ksort;
use function property_exists;
use function sprintf;
use function strpos;

final class CreateLinks
{
    /** @var array<string, AbstractDescriptor> */
    private $descriptors = [];

    /** @var array<string, stdClass> */
    private $rawDescriptors = [];

    /** @var array<string, Link> */
    private $links = [];

    /** @var LabelNameInterface */
    private $label;

    public function __construct(LabelNameInterface $label)
    {
        $this->label = $label;
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     * @param array<string, stdClass>           $rawDescriptors
     *
     * @return array<string, Link>
     */
    public function __invoke(array $descriptors, array $rawDescriptors): array
    {
        $this->rawDescriptors = $rawDescriptors;
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
            /** @var list<stdClass> $rawDescriptors */
            $rawDescriptors = $raw->descriptor;
            $this->scanTransition(new SemanticDescriptor($raw), $rawDescriptors);
        }

        $isTransitionalDescriptor = isset($raw->rt) && is_string($raw->rt) && is_int(strpos($raw->rt, '#'));
        if ($isTransitionalDescriptor) {
            [, $id] = explode('#', $raw->rt);
            assert(isset($this->rawDescriptors[$id]));

            $rawDescriptor = $this->rawDescriptors[$id];
            $this->scanRawDescriptor($rawDescriptor);
        }
    }

    /**
     * @param list<stdClass> $instances
     */
    private function scanTransition(SemanticDescriptor $semantic, array $instances): void
    {
        foreach ($instances as $instance) {
            $isHref = property_exists($instance, 'href') && is_string($instance->href);
            if ($isHref) {
                [, $descriptorId] = explode('#', $instance->href);
                $isTransDescriptor = isset($this->descriptors[$descriptorId]) && $this->descriptors[$descriptorId] instanceof TransDescriptor;
                if ($isTransDescriptor) {
                    $transSemantic = $this->descriptors[$descriptorId];
                    /** @psalm-suppress RedundantCondition */
                    assert($transSemantic instanceof TransDescriptor);
                    $this->setLink(new Link($semantic, $transSemantic, $this->label));
                }

                continue;
            }

            $isTransDescriptor = isset($instance->type) && in_array($instance->type, ['safe', 'unsafe', 'idempotent'], true);
            if ($isTransDescriptor) {
                assert(property_exists($instance, 'id') && is_string($instance->id));
                $this->setLink(new Link($semantic, new TransDescriptor($instance, $semantic), $this->label));
                $this->descriptors[$instance->id] = new TransDescriptor($instance, $semantic);
            }
        }
    }

    private function setLink(Link $link): void
    {
        $edgeId = sprintf('%s->%s:%s', $link->from, $link->to, $link->transDescriptor->id);
        $this->links[$edgeId] = $link;
    }
}
