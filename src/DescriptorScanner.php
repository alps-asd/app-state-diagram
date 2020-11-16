<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Koriym\AppStateDiagram\Exception\DescriptorIsNotArrayException;
use Koriym\AppStateDiagram\Exception\InvalidDescriptorException;
use stdClass;

use function assert;
use function in_array;
use function is_array;
use function is_string;
use function json_encode;

final class DescriptorScanner
{
    /**
     * @param list<stdClass> $descriptorsArray
     *
     * @return array<string, AbstractDescriptor>
     */
    public function __invoke(array $descriptorsArray, ?stdClass $parentDescriptor = null): array
    {
        $descriptors = [];
        foreach ($descriptorsArray as $descriptor) {
            $descriptors = $this->scan($descriptor, $descriptors, $parentDescriptor);
        }

        return $descriptors;
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     *
     * @return array<AbstractDescriptor>
     */
    private function scan(stdClass $descriptor, array $descriptors, ?stdClass $parentDescriptor): array
    {
        $this->defaultSemantic($descriptor);
        $this->validateDescriptor($descriptor);

        if (isset($descriptor->id) && $descriptor->type === 'semantic') {
            $descriptors[$descriptor->id] = new SemanticDescriptor($descriptor, $parentDescriptor);
        }

        $isTransDescriptor = isset($descriptor->type) && in_array($descriptor->type, ['safe', 'unsafe', 'idempotent'], true);
        if ($isTransDescriptor) {
            $parant = $parentDescriptor ?? new NullDescriptor();
            assert(is_string($descriptor->id));

            $descriptors[$descriptor->id] = new TransDescriptor($descriptor, new SemanticDescriptor($parant));
        }

        if (isset($descriptor->descriptor)) {
            $descriptors = $this->scanInlineDescriptor($descriptor, $descriptors);
        }

        return $descriptors;
    }

    private function defaultSemantic(stdClass $descriptor): void
    {
        if (isset($descriptor->id) && ! isset($descriptor->type)) {
            $descriptor->type = 'semantic';
        }
    }

    /**
     * @param array<AbstractDescriptor> $descriptors
     *
     * @return array<string, AbstractDescriptor>
     */
    private function scanInlineDescriptor(stdClass $descriptor, array $descriptors): array
    {
        if (! is_array($descriptor->descriptor)) {
            $msg = is_string($descriptor->descriptor) ? $descriptor->descriptor : json_encode($descriptor);

            throw new DescriptorIsNotArrayException((string) $msg);
        }

        $inLineSemantics = $this->__invoke($descriptor->descriptor, $descriptor);
        if ($inLineSemantics !== []) {
            $descriptors = $this->addInlineSemantics($descriptors, $inLineSemantics);
        }

        return $descriptors;
    }

    /**
     * @param array<string, AbstractDescriptor> $descriptors
     * @param array<string, AbstractDescriptor> $inLineSemantics
     *
     * @return array<string, AbstractDescriptor>
     */
    private function addInlineSemantics(array $descriptors, array $inLineSemantics): array
    {
        foreach ($inLineSemantics as $inLineSemantic) {
            if ($inLineSemantic instanceof SemanticDescriptor) {
                $descriptors[$inLineSemantic->id] = $inLineSemantic;
            }
        }

        return $descriptors;
    }

    private function validateDescriptor(stdClass $descriptor): void
    {
        $hasNoId = ! isset($descriptor->href) && ! isset($descriptor->id);
        if ($hasNoId) {
            throw new InvalidDescriptorException((string) json_encode($descriptor));
        }
    }
}
